import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: '#1E4720' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#1E4720',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="entregas" options={{ title: 'Entregas', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="motorbike" color={color} size={size} /> }} />
      <Tabs.Screen
        name="carteira"
        options={{
          title: 'Carteira',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cash-multiple" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="extrato" options={{ href: null }} />
      <Tabs.Screen name="solicitar-saque" options={{ href: null }} />
      <Tabs.Screen
        name="ajuda"
        options={{
          title: 'Ajuda',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="help-circle" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} /> }} />
      <Tabs.Screen name="pedidos-teste" options={{ href: null }} />
      <Tabs.Screen name="pagamento" options={{ href: null }} />
      <Tabs.Screen name="entrega-detalhes" options={{ href: null }} />
      <Tabs.Screen name="avaliar-cliente" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="termos" options={{ href: null }} />
    </Tabs>
  );
}
