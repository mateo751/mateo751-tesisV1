import { useContext } from 'react';
import { SMSContext } from '@/context/SMSContext';
export function useSMS() {
    return useContext(SMSContext);
};
