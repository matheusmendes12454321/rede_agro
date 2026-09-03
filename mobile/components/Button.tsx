import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'solid' | 'outline';
}

export function Button({ title, variant = 'solid', style, ...rest }: ButtonProps) {
  const isSolid = variant === 'solid';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSolid ? styles.btnSolid : styles.btnOutline,
        style,
      ]}
      activeOpacity={0.7}
      {...rest}
    >
      <Text style={isSolid ? styles.textSolid : styles.textOutline}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnSolid: {
    backgroundColor: '#198754',
  },
  btnOutline: {
    borderWidth: 2,
    borderColor: '#198754',
    backgroundColor: 'transparent',
  },
  textSolid: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textOutline: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});