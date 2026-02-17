import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useRef } from 'react';
import { theme } from '../../constants/theme';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export default function AnimatedButton({ 
  title, 
  onPress, 
  loading, 
  variant = 'primary',
  size = 'medium',
  disabled 
}: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          styles[`button_${variant}`],
          styles[`button_${size}`],
          (disabled || loading) && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#fff' : theme.colors.primary} />
        ) : (
          <Text style={[
            styles.buttonText,
            styles[`buttonText_${variant}`],
            styles[`buttonText_${size}`],
          ]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Variants
  button_primary: {
    backgroundColor: theme.colors.primary,
  },
  button_secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  button_medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  button_large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
  },
  
  buttonDisabled: {
    opacity: 0.5,
  },
  
  buttonText: {
    fontWeight: '600',
  },
  
  // Text variants
  buttonText_primary: {
    color: '#fff',
  },
  buttonText_secondary: {
    color: theme.colors.primary,
  },
  buttonText_ghost: {
    color: theme.colors.primary,
  },
  
  // Text sizes
  buttonText_small: {
    fontSize: 14,
  },
  buttonText_medium: {
    fontSize: 16,
  },
  buttonText_large: {
    fontSize: 18,
  },
});
