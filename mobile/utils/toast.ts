import { Alert } from 'react-native';

export const showToast = {
  success: (message: string, title: string = 'Sukces') => {
    // Na web użyj native alert, na mobile będzie lepiej wyglądać
    if (typeof window !== 'undefined') {
      // Browser toast (prosty)
      const toast = document.createElement('div');
      toast.innerHTML = `
        <div style="
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: #34C759;
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          z-index: 9999;
          animation: slideDown 0.3s ease;
        ">
          ${title}: ${message}
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    } else {
      Alert.alert(title, message);
    }
  },
  
  error: (message: string, title: string = 'Błąd') => {
    if (typeof window !== 'undefined') {
      const toast = document.createElement('div');
      toast.innerHTML = `
        <div style="
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: #FF3B30;
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          z-index: 9999;
        ">
          ${title}: ${message}
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 4000);
    } else {
      Alert.alert(title, message);
    }
  },
  
  info: (message: string, title: string = 'Info') => {
    if (typeof window !== 'undefined') {
      const toast = document.createElement('div');
      toast.innerHTML = `
        <div style="
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: #0A84FF;
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          z-index: 9999;
        ">
          ${title}: ${message}
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } else {
      Alert.alert(title, message);
    }
  },
};
