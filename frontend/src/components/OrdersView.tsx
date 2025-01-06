import React, { useState, useEffect } from 'react';
import { bakeryApi } from '../api/bakeryApi';
import { Order } from '../types';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await bakeryApi.getOrders(); // Replace with actual API call
        setOrders(response);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">All Orders</h2>
      
      {loading && <p>Loading orders...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <table className="min-w-full table-auto border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">Order ID</th>
              <th className="border px-4 py-2 text-left">Customer Name</th>
              <th className="border px-4 py-2 text-left">Delivery Date</th>
              <th className="border px-4 py-2 text-left">Delivery Slot</th>
              <th className="border px-4 py-2 text-left">Items</th>
              <th className="border px-4 py-2 text-left">Location</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{order.id}</td>
                <td className="border px-4 py-2">{order.customerName}</td>
                <td className="border px-4 py-2">{order.deliveryDate}</td>
                <td className="border px-4 py-2">{order.deliverySlot}</td>
                <td className="border px-4 py-2">
                  {order.items.map((item) => (
                    <div key={item.product}>
                      {item.product}: {item.quantity}
                    </div>
                  ))}
                </td>
                <td className="border px-4 py-2">{order.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrderList;
