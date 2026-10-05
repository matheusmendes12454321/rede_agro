import { StyleSheet, Text, View } from "react-native";

type PontuacaoProps = {
  jogador: string;
  pontuacao: number;
}

export default function Pontuacao( { jogador, pontuacao }: PontuacaoProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.jogador}>{jogador}</Text>
      <Text style={styles.pontuacao}>{pontuacao}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  jogador: {
    color: "rgb(255, 0, 0)",
    fontSize: 30,
  },
  pontuacao: {
    fontSize: 30,
  },
});
