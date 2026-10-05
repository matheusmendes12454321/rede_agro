import Cronometro from "@/componentes/Cronometro";
import Placar from "@/componentes/Placar";
import Contato from "@/componentes/Contato";
import { StyleSheet, View } from "react-native";
import Pontuacao from "@/componentes/Pontuacao";
import { ContatoType, CronometroType, PlacarType } from "@/core/tipo";



// Correção do uso de '=' para ':' na atribuição dos valores do objeto
let contato2: ContatoType = {
  id: 1,
  nome: 'Matheus',
  telefone: '12121222'
};

let contato1: ContatoType = {
  id: 2,
  nome: 'Goleiro',
  telefone: '123332'
};

let pontuacao: PlacarType = {
  Jogador0: 5,
  jogadorX: 4,

}



export default function Index() {
  return (
    <View style={styles.container}>
      <Contato contato={contato2}/>
      <Contato contato={contato1}/>
      <Placar placar={pontuacao} />
      <Cronometro tempo={5}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgb(72, 161, 255)",
  },
  texto: {
    color: "#ffffff",
  },
});
