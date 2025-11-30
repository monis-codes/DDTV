import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';


export default function video() { 

    const {id} = useLocalSearchParams();

  return (
    <View>
      <Text> video {id} </Text>
    </View>
  );
};

