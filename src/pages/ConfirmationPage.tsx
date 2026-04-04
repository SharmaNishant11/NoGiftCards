import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderConfirmationComponent from '@/components/OrderConfirmation';

const ConfirmationPage = () => {
  const navigate = useNavigate();

  const orderData = useMemo(() => {
    const stored = sessionStorage.getItem('orderData');
    return stored ? JSON.parse(stored) : {
      orderNumber: 'ALC-DEMO1234',
      recipientName: 'Alex',
      giftName: 'Cold Brew Ritual Kit',
      deliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      totalPaid: 46.99,
    };
  }, []);

  return (
    <OrderConfirmationComponent
      {...orderData}
      onNewQuest={() => navigate('/profile')}
    />
  );
};

export default ConfirmationPage;
