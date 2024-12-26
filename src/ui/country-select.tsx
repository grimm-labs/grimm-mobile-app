/* eslint-disable unused-imports/no-unused-vars */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import type { ViewProps } from 'react-native';
import { Modal, Pressable, View } from 'react-native';

import { CountryListModal } from '@/components/modals/country-list';
import { Image } from '@/ui';

interface Props extends ViewProps {
  countryCode: string;
  countryPhoneCode: string;
  onPress: () => void;
}

export const CountrySelect = ({ style, ...props }: Props) => {
  const [isSelectCountryModalOpen, setIsSelectCountryModalOpen] =
    useState(false);

  return (
    <Pressable onPress={() => setIsSelectCountryModalOpen(true)}>
      <View className="flex flex-row items-center justify-center border-b-[1.3px] border-primary-600 p-1">
        <Image
          style={{ width: 32, height: 32 }}
          className="rounded-full"
          contentFit="fill"
          source={{
            uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAeCAIAAADRv8uKAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAASAAAAEgARslrPgAABJ1JREFUSMfll19oU1ccx3+/c29yc2PaJG2TGFvTuljRdnViWx9sxSmlutmhFl+GCBvCQPBhyAR92VDwcb74IJTucQo+zVFQJs6/9M/AlqrB2cZqbbLYJrRNanL/5J7z20McbA/rbevci+fhcC/nz+d8fz/u73wvgl2TADjAdwBdAFkA6V+mcQZeAX1b4czXIOWBM5tt7cbfWXv/wPJKFiH+45XofwEjlkgIQKW+dA4EgGWcYHlgBCDGoLwcXC5DVaVsFnWdEUGhUCK/AzAiAnCHg2prcds2i3M5FOIjI8Q5hsNyIgFPn8Bcbum67cFUohJZTqfR1OSKRPjYmJzNOhTF8ngQQLjdptdr7d/v+flXtBKASEtg24MREYisSASiUUmWpVhMGhsDr7fg88HsrDI3Jw8NUUODjgTr15tqDqwcINrqlm2pnEiW5bpjx6RoVL13T9y4oUSjxsxMoLNTFAra1auOmhqIxSo/65LqPwznR0D7nqT/QjEAfHrgwMaqqvzEhDQ6KgBcXV08nY5euKBPT8cNQ6mo0Ht65Hh8QVEb123arnzcP3cbmU3AFysgiEhEq9xuYZovBwbcr14V794FAF8k4nW7zQcP+MOHXr+/LBwGALOvr7wokg9uqMIlk2SbZmmRMcYYEe3etautra19z575vj5aWGCqKlpaPLt3o89HLhdFIrnxcXN0lDwe8vqDRw9rEhQNc6o4xZAtgrdRDAB1dXWesjJ/fb2aTEZ7e9Xm5nw2+/vFi4+am2M7dz6/di2fSnn37l179qw78dK7oaGy6Kv3bADxZvlKwEQEAE6nkwsxfOmS/9AhT03N64mJ4szMms2b15486SwWnY8fc84LyWSwo0Pt7Hx6/ToyWZZkQHirHAOAqqodHR2NO3Zwzqd6e9n4eNqysLnZf+6c9/z5hYWF+bKy4uBg6qerksezoWlre8OOomyCAFy0lkmLg4lIEFWvXp1LJNZUV6dOn0aA6u5uPj2dHRhw1tdLDkcVY8bQUGFk2P/F0ZeTo0kwLicvpymNgCvMcSnU8Xj8ta6n+vsTuZxRVaU0NdUcObK6rc1tmvKLF8HW1tDBg3IwaFQF4pOTqftDf1iZZ1rcNtQ2lZ0xJoTo6u4+1d7u0HVfa6s+OGgND4OiQCCAhoHz80Qkbdni2r597tYtHgp9U3llYPYOk5gAscjONgWkJPq3+/fVEyc2hkLPbt7MFIv67dssHAafD2WZJ5OkaeVtbcqL5x99+VX/1OBwbBAksP2O7e8yCZETfVtb+8nhwxkhVgWDDNGIxRzT00KSnOvWOVta8pmM+TrnT2vXYj1nPs8wEwW+Xa1+I5oxnJyEK1cqjx+v2LdvLJWiTZv8FRUzmYzpcpUFAmGAuV+uix8u4AcZcDAwhK2iJdxOACAEMOaIx3OnTulPngQaG+c1LW9ZKgCWl69SVfPOHe3yjz6LyIFAYimWYMlGQAhCFLqe7ulBRFVRSNclRFCUWcMgImRAACCW6n6W4zKJANHBmExEmgaMEQBpmkzkYAyI3qHnAiLiHAAAEf56IADgfLlGeUX2Fv5maVfkbeF9/JP4E60nG6TGip3CAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDEzLTEwLTA3VDEzOjE0OjQwKzAyOjAwHXwFzwAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxMy0xMC0wN1QxMzoxNDo0MCswMjowMGwhvXMAAAAASUVORK5CYII=',
          }}
        />
        <Ionicons name="chevron-down" className="ml-2" size={20} color="gray" />
      </View>
      <Modal
        visible={isSelectCountryModalOpen}
        onRequestClose={() => setIsSelectCountryModalOpen(false)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <CountryListModal onClose={() => setIsSelectCountryModalOpen(false)} />
      </Modal>
    </Pressable>
  );
};
