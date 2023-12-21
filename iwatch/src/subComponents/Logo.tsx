/*
********************************************
 Copyright © 2021 Agora Lab, Inc., all rights reserved.
 AppBuilder and all associated components, source code, APIs, services, and documentation 
 (the “Materials”) are owned by Agora Lab, Inc. and its licensors. The Materials may not be 
 accessed, used, modified, or distributed for any purpose without a license from Agora Lab, Inc.  
 Use without a license or in violation of any license terms and conditions (including use for 
 any purpose competitive to Agora Lab, Inc.’s business) is strictly prohibited. For more 
 information visit https://appbuilder.agora.io. 
*********************************************
*/
import React from 'react';
import {Image, TouchableOpacity, StyleSheet} from 'react-native';
import {useHistory} from '../components/Router';
// @ts-ignore
import iwatch_logo from '../components/assets/icons/iwatch_logo.png';

/**
 * Displays the logo.
 */
export default function Logo() {
  const history = useHistory();

  return (
    <TouchableOpacity onPress={() => history.replace('/')} style={styles.marginAuto}>
      <Image
        source={iwatch_logo}
        style={styles.logo}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: '100%',
    height: '100%',
  },
  marginAuto: {
    width: '70%',
    height: '70%',
    minWidth: 60,
    minHeight: 30,
    // height: 'auto',
    marginHorizontal: 'auto',
  },
});
