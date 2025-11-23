import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { CONFIG } from './config';

const { width } = Dimensions.get('window');

export default function App() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [multiSpeaker, setMultiSpeaker] = useState(true);
  const intervalRef = useRef(null);
  const pausedDurationRef = useRef(0);
  
  // Animation values
  const recordButtonScale = useRef(new Animated.Value(1)).current;
  const recordButtonPulse = useRef(new Animated.Value(1)).current;
  const toggleAnimation = useRef(new Animated.Value(multiSpeaker ? 1 : 0)).current;
  const visualizationAnims = useRef(
    Array.from({ length: 4 }, () => new Animated.Value(0.3))
  ).current;
  const recordingIndicatorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Request audio permissions on mount
    requestAudioPermissions();
    
    // Configure audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Animate recording indicator
    if (isRecording && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingIndicatorOpacity, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(recordingIndicatorOpacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      recordingIndicatorOpacity.setValue(1);
    }

    return () => {
      // Cleanup interval on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    // Animate visualization bars
    if (isRecording && !isPaused) {
      const animations = visualizationAnims.map((anim, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: Math.random() * 0.7 + 0.3,
              duration: 300 + Math.random() * 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: Math.random() * 0.5 + 0.2,
              duration: 300 + Math.random() * 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        );
      });
      
      Animated.parallel(animations).start();
    } else {
      visualizationAnims.forEach(anim => {
        Animated.timing(anim, {
          toValue: 0.2,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();
      });
    }
  }, [isRecording]);

  useEffect(() => {
    // Animate toggle
    Animated.timing(toggleAnimation, {
      toValue: multiSpeaker ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [multiSpeaker]);

  const requestAudioPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant microphone permissions to use this app.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Failed to request permissions:', err);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone permission is required.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(pausedDurationRef.current);
      pausedDurationRef.current = 0;

      // Animate record button
      Animated.parallel([
        Animated.spring(recordButtonScale, {
          toValue: 1.1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(recordButtonPulse, {
              toValue: 1.15,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(recordButtonPulse, {
              toValue: 1.1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();

      // Start timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const pauseRecording = async () => {
    if (!recording || !isRecording || isPaused) return;

    try {
      // Stop the timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Stop the current recording (expo-av doesn't support pause)
      // Save the duration so we can continue tracking total time
      pausedDurationRef.current = recordingDuration;
      
      // Stop and unload the recording
      await recording.stopAndUnloadAsync();
      
      setIsPaused(true);
      setIsRecording(false);
      setRecording(null);

      // Animate record button to paused state
      Animated.parallel([
        Animated.spring(recordButtonScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(recordButtonPulse, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err) {
      console.error('Failed to pause recording:', err);
      Alert.alert('Error', 'Failed to pause recording.');
    }
  };

  const resumeRecording = async () => {
    if (!isPaused) {
      // If not paused, just start recording normally
      await startRecording();
      return;
    }

    try {
      const { status } = await Audio.getPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone permission is required.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start a new recording (continuing from paused duration)
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setIsPaused(false);
      // Keep the duration from before pause

      // Animate record button
      Animated.parallel([
        Animated.spring(recordButtonScale, {
          toValue: 1.1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(recordButtonPulse, {
              toValue: 1.15,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(recordButtonPulse, {
              toValue: 1.1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();

      // Resume timer from where we left off
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to resume recording:', err);
      Alert.alert('Error', 'Failed to resume recording. Please try again.');
    }
  };

  const cancelRecording = async () => {
    try {
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Stop and discard recording if it exists
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (err) {
          // Recording might already be stopped
          console.log('Recording already stopped or error stopping:', err);
        }
      }

      // Animate record button back
      Animated.parallel([
        Animated.spring(recordButtonScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(recordButtonPulse, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // Reset all states
      setRecording(null);
      setIsRecording(false);
      setIsPaused(false);
      setRecordingDuration(0);
      pausedDurationRef.current = 0;
    } catch (err) {
      console.error('Failed to cancel recording:', err);
      Alert.alert('Error', 'Failed to cancel recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Animate record button back
      Animated.parallel([
        Animated.spring(recordButtonScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(recordButtonPulse, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      setIsRecording(false);
      setIsPaused(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      // Send to webhook
      await sendToWebhook(uri);

      setRecording(null);
      setRecordingDuration(0);
      pausedDurationRef.current = 0;
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const sendToWebhook = async (audioUri) => {
    try {
      const webhookUrl = CONFIG.WEBHOOK_URL;
      console.log('Environment:', CONFIG.ENVIRONMENT);
      console.log('Using webhook URL:', webhookUrl);
      if (!webhookUrl || webhookUrl === 'YOUR_WEBHOOK_URL_HERE') {
        Alert.alert(
          'Configuration Required',
          'Please set your webhook URL in config.js'
        );
        return;
      }

      // Get file name
      const fileName = audioUri.split('/').pop() || 'recording.m4a';

      // Prepare form data
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: fileName,
      });
      formData.append('duration', recordingDuration.toString());
      formData.append('multiSpeaker', multiSpeaker.toString());

      // Send to webhook
      // Note: Don't set Content-Type header - React Native will set it automatically with boundary
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        Alert.alert('Success', 'Recording sent successfully!');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending to webhook:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to send recording. Please check your webhook URL and try again.'
      );
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePress = () => {
    setMultiSpeaker(!multiSpeaker);
  };

  const toggleThumbPosition = toggleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 24],
  });

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.timerContainer}
        >
          <View style={styles.timerContent}>
            <Text style={styles.timerText}>{formatTime(recordingDuration)}</Text>
          </View>
        </LinearGradient>
        <View style={styles.headerRight}>
          {isRecording && !isPaused && (
            <Animated.View
              style={[
                styles.recordingIndicator,
                { opacity: recordingIndicatorOpacity },
              ]}
            />
          )}
          {isPaused && (
            <View style={styles.pausedIndicator}>
              <Text style={styles.pausedText}>⏸</Text>
            </View>
          )}
        </View>
      </View>

      {/* Audio Visualization */}
      <View style={styles.visualizationContainer}>
        {visualizationAnims.map((anim, index) => {
          const height = anim.interpolate({
            inputRange: [0, 1],
            outputRange: ['20%', '100%'],
          });
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.visualizationBarWrapper,
                { height: height },
              ]}
            >
              <LinearGradient
                colors={isRecording ? ['#667eea', '#764ba2', '#f093fb'] : ['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.visualizationBar}
              />
            </Animated.View>
          );
        })}
      </View>

      {/* Multi-speaker Toggle */}
      <View style={styles.multiSpeakerContainer}>
        <View style={styles.multiSpeakerLabel}>
          <Text style={styles.multiSpeakerText}>Multi-speaker</Text>
          <View style={styles.multiSpeakerIcon}>
            <View style={styles.iconPerson} />
            <View style={[styles.iconPerson, styles.iconPersonOverlap]} />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.toggle, multiSpeaker && styles.toggleActive]}
          onPress={handleTogglePress}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.toggleThumb,
              { left: toggleThumbPosition },
            ]}
          />
        </TouchableOpacity>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          activeOpacity={0.7}
          onPress={cancelRecording}
          disabled={!recording && !isRecording && !isPaused}
        >
          <LinearGradient
            colors={recording || isRecording || isPaused ? ['#667eea', '#764ba2'] : ['#555', '#333']}
            style={styles.controlButtonGradient}
          >
            <Text style={styles.controlButtonText}>↻</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={isRecording ? stopRecording : isPaused ? resumeRecording : startRecording}
          activeOpacity={0.9}
        >
          <Animated.View
            style={[
              styles.recordButtonWrapper,
              {
                transform: [
                  { scale: Animated.multiply(recordButtonScale, recordButtonPulse) },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={isRecording ? ['#ff6b6b', '#ee5a6f'] : isPaused ? ['#f39c12', '#e67e22'] : ['#667eea', '#764ba2']}
              style={styles.recordButton}
            >
              <View style={[styles.recordButtonInner, (isRecording || isPaused) && styles.recordButtonInnerActive]} />
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          activeOpacity={0.7}
          onPress={isPaused ? resumeRecording : pauseRecording}
          disabled={!recording && !isRecording}
        >
          <LinearGradient
            colors={(recording || isRecording) && !isPaused ? ['#667eea', '#764ba2'] : ['#555', '#333']}
            style={styles.controlButtonGradient}
          >
            <Text style={styles.controlButtonText}>{isPaused ? '▶' : '⏸'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerLeft: {
    width: 30,
  },
  timerContainer: {
    borderRadius: 25,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  timerContent: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  timerText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 30,
    alignItems: 'flex-end',
  },
  recordingIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  pausedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f39c12',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f39c12',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  pausedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  visualizationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 240,
    paddingHorizontal: 48,
    gap: 16,
  },
  visualizationBarWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    minHeight: 40,
  },
  visualizationBar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  multiSpeakerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 50,
    marginBottom: 80,
  },
  multiSpeakerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  multiSpeakerText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  multiSpeakerIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -8,
  },
  iconPerson: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    opacity: 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconPersonOverlap: {
    marginLeft: -8,
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    paddingHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 50,
    marginBottom: 50,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  controlButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '600',
  },
  recordButtonWrapper: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  recordButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recordButtonInnerActive: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
});

