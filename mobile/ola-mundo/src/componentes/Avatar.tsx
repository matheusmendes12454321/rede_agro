import { Image, StyleSheet, View } from "react-native";

export default function Avatar() {
  return (
    <View style={styles.container}>
      <Image
        style={styles.imagem}
        source={require("../../assets/jacare.jpg")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 56,
    height: 56,
    borderWidth: 3,
    borderColor: "#00dc1a",
    borderRadius: 28,
    overflow: "hidden",
  },
  imagem: {
    width: "100%",
    height: "100%",
  },
});
