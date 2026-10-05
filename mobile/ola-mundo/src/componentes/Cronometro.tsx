import { Text, View } from "react-native";

type CronometroProps = {
  tempo: number
}

export default function Cronometro({tempo}: CronometroProps) {
  return (
    <View>
      <Text>{tempo}</Text>
    </View>
  );
}
