export interface Country {
  currency: string;
  callingCode: string;
  region: string;
  subregion: string;
  name: string;
  nameFr: string;
  isoCode: string;
}

export interface ClearButtonProps {
  onPress: () => void;
  visible: boolean;
}

export interface User {
  id: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  birthDate?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
