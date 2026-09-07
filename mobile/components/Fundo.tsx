import React from 'react';
import { Image, View } from 'react-native';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 100 }: LogoProps) {
  return (
    <View>
      <Image
        source={require('../assets/images/fundo.png')}
      />
    </View>
  );
}
