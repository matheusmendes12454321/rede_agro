import { Button } from '@/components/Button'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'

const Tab = createBottomTabNavigator()


export default function Navigation(){
    <Tab.Navigator>
        <Tab.Screen
            name='home'
            component={Button}
        />
    </Tab.Navigator>
}