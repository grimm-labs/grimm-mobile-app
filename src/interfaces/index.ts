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
