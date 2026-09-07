import React from 'react';
import { Image, View } from 'react-native';

interface LogoProps {
  size?: number;
}
export function Logo({ size = 100 }: LogoProps) {
  return (
    <View>
      <Image
        source={require('../assets/images/logo.png')}
        style={{ width: size * 0.7, height: size * 0.7 }}
        resizeMode="contain"
      />
    </View>
  );
}
