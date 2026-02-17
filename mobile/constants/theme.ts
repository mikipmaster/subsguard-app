export const theme = {
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      background: '#F5F5F7',
      surface: '#FFFFFF',
      surfaceGlass: 'rgba(255, 255, 255, 0.75)',
      text: '#1C1C1E',
      textSecondary: '#6E6E73',
      border: '#C6C6C8',
      borderLight: '#E5E5EA',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      info: '#0A84FF',
    },
    spacing: {
      xs: 4,
      s: 8,
      m: 12,
      l: 16,
      xl: 24,
      xxl: 32,
    },
    radius: {
      s: 8,
      m: 12,
      l: 16,
      xl: 20,
      xxl: 24,
    },
    typography: {
      // Display (Huge titles)
      displayLarge: {
        fontSize: 48,
        fontWeight: '800',
        lineHeight: 56,
        letterSpacing: -0.5,
      },
      display: {
        fontSize: 40,
        fontWeight: '700',
        lineHeight: 48,
        letterSpacing: -0.5,
      },
      
      // Titles
      titleLarge: {
        fontSize: 34,
        fontWeight: '700',
        lineHeight: 41,
        letterSpacing: 0.37,
      },
      title: {
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 34,
        letterSpacing: 0.36,
      },
      titleMedium: {
        fontSize: 22,
        fontWeight: '600',
        lineHeight: 28,
        letterSpacing: 0.35,
      },
      
      // Headlines
      headline: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 25,
        letterSpacing: 0.38,
      },
      
      // Body
      bodyLarge: {
        fontSize: 18,
        fontWeight: '400',
        lineHeight: 24,
        letterSpacing: -0.24,
      },
      body: {
        fontSize: 17,
        fontWeight: '400',
        lineHeight: 22,
        letterSpacing: -0.41,
      },
      bodyMedium: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 21,
        letterSpacing: -0.32,
      },
      
      // Callout
      callout: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 21,
        letterSpacing: -0.32,
      },
      
      // Subheadline
      subheadline: {
        fontSize: 15,
        fontWeight: '400',
        lineHeight: 20,
        letterSpacing: -0.24,
      },
      
      // Footnote
      footnote: {
        fontSize: 13,
        fontWeight: '400',
        lineHeight: 18,
        letterSpacing: -0.08,
      },
      
      // Caption
      caption: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
        letterSpacing: 0,
      },
      captionSmall: {
        fontSize: 11,
        fontWeight: '400',
        lineHeight: 13,
        letterSpacing: 0.07,
      },
    },
    shadows: {
      small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
      large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
    },
  } as const;
  