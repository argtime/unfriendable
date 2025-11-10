import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { LockClosedIcon, CreditCardIcon } from '@heroicons/react/24/solid';

const PaymentRequiredPage: React.FC = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    return value
      .replace(/\s/g, '')
      .replace(/\D/g, '')
      .replace(/(\d{2})/, '$1 / ')
      .trim()
      .slice(0, 7);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate a network request
    setTimeout(() => {
      setLoading(false);
      toast.error('Payment failed. Please check your details and try again.');
      // Clear all inputs to frustrate the user
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setName('');
    }, 1500);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md animate-fade-in">
        <div className="text-center">
            <LockClosedIcon className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="text-3xl font-bold text-center text-light mt-4">Account Locked</h1>
            <p className="text-medium mt-2 mb-6">
                You have run out of unfriends. To unlock your account and continue connecting, a payment is required.
            </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-medium mb-1">Card Number</label>
            <div className="relative">
                <Input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    required
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="pl-10"
                />
                <CreditCardIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-medium mb-1">Expiry Date</label>
                <Input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    required
                    placeholder="MM / YY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-medium mb-1">CVC</label>
                <Input
                    type="text"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    placeholder="123"
                    maxLength={4}
                />
              </div>
          </div>
           <div>
            <label className="block text-sm font-medium text-medium mb-1">Name on Card</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your Name"
            />
          </div>
          <Button type="submit" loading={loading} className="w-full !mt-6">
            Pay $5.00 to Unlock
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default PaymentRequiredPage;
