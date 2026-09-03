import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 100 }: LogoProps) {
  return (
    <View>
      <Image
        source={require('../assets/images/Fundo.png')}
      />
    </View>
  );
}
