# 🚀 INSTRUKCJA ODPALANIA PROJEKTU

***

## 📋 **KROK PO KROKU:**

### **1. Otwórz VS Code w folderze głównym projektu**
```
subscription-manager/
├── backend/
├── mobile/
└── ...
```

***

### **2. Otwórz 2 TERMINALE w VS Code**

**Sposób 1:**
- Kliknij **Terminal** → **New Terminal** (pierwszy terminal)
- Kliknij **+** (plus) w prawym górnym rogu panelu terminala (drugi terminal)

**Sposób 2:**
- Naciśnij **Ctrl + Shift + `** (pierwszy terminal)
- Naciśnij ponownie **Ctrl + Shift + `** (drugi terminal)

***

## 🔴 **TERMINAL 1: BACKEND**

### **Krok 1: Przejdź do folderu backend**
```bash
cd backend
```

### **Krok 2: Uruchom backend**
```bash
npm run dev
```

**Zobaczysz:**
```
🚀 SubsGuard API Server Running
Port: 3000
Environment: development
API URL: http://localhost:3000
```

✅ **Backend działa na http://localhost:3000**

***

## 🟢 **TERMINAL 2: FRONTEND (Mobile)**

### **Krok 1: Przejdź do folderu mobile**
```bash
cd mobile
```

### **Krok 2: Uruchom frontend**
```bash
npx expo start
```

**Zobaczysz:**
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### **Krok 3: Wybierz platformę**

**Naciśnij w terminalu:**
- **`a`** - Android emulator
- **`i`** - iOS simulator (tylko Mac)
- **`w`** - Web browser
- **Zeskanuj QR kod** - telefon z Expo Go

***

## 📱 **SZYBKIE PORADY:**

### **Restart aplikacji:**
- **Backend:** Ctrl+C w terminalu 1, potem `npm run dev`
- **Frontend:** Naciśnij **`r`** w terminalu 2 (reload) lub **`Ctrl+C`** → `npx expo start`

### **Jeśli coś nie działa:**
```bash
# W terminalu mobile
npx expo start --clear
```

***

## 🎯 **QUICK START (po otwarciu VS Code):**

**Terminal 1:**
```bash
cd backend && npm run dev
```

**Terminal 2:**
```bash
cd mobile && npx expo start
```

***

## ✅ **GOTOWE!**

**Backend:** http://localhost:3000  
**Frontend:** Expo (telefon/emulator)

**Masz już oba serwery uruchomione!** 🔥