import { StyleSheet, View } from "react-native";
import Pontuacao from "./Pontuacao";
import { PlacarType } from "@/core/tipo";

type PlacarProps = {
  placar: PlacarType
}

export default function Placar({placar}: PlacarProps) {
  return (
    <View style={styles.container}>
      <Pontuacao jogador="X" pontuacao={placar.jogadorX} />
      <Pontuacao jogador="0" pontuacao={placar.Jogador0} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 8,
    borderRadius: 15,
    margin: 10,
  },
});
