import { StyleSheet, Text, View } from "react-native";
import Avatar from "./Avatar";
import { ContatoType } from "../core/tipo";

type ContatoProps = {
  contato: ContatoType;
}

export default function Contato({ contato }: ContatoProps) {
  return (
    <View style={styles.container}>
      <Avatar />
      <View>
        <Text style={styles.nome}>{contato.nome}</Text>
        <Text style={styles.telefone}>{contato.telefone}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  nome: {
    fontWeight: "bold",
    fontSize: 15,
  },
  telefone: {
    color: "#7f7f7f",
  },
});