'use client';
import { useEffect } from 'react';
import { useQuery } from 'react-query';
import { useRouter } from 'next/navigation';
import { addNotification, store } from '@/store';
import { ROUTES, CONFIG, QUERIES } from '@/utils';
import { Loader } from '@keyval-dev/design-system';
import { getDestinations, getConfig } from '@/services';

export default function App() {
  const router = useRouter();
  const config = useQuery([QUERIES.API_CONFIG], getConfig);
  const destinations = useQuery([QUERIES.API_DESTINATIONS], getDestinations);

  useEffect(() => {
    if (config['isLoading'] || destinations['isLoading']) {
      return;
    }

    if (!!config['error'] || !!destinations['error']) {
      const title = (!!config['error'] ? 'Config' : 'Destinations') + ' Error';
      // @ts-ignore (?.message is not recognized but does exist)
      const message = config['error']?.message || destinations['error']?.message || 'An error occurred';

      store.dispatch(addNotification({ id: '1', type: 'error', title, message, target: '', crdType: '' }));
      router.push(ROUTES.OVERVIEW);

      return;
    }

    if (config['data'].installation === CONFIG.FINISHED || destinations['data'].length > 0) {
      router.push(ROUTES.OVERVIEW);
    } else {
      router.push(ROUTES.CHOOSE_SOURCES);
    }
  }, [config['isLoading'], config['error'], config['data'], destinations['isLoading'], destinations['error'], destinations['data']]);

  return <Loader />;
}
