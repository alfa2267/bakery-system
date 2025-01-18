import React from 'react';
import { ScheduledTask, Order } from '../types';
import { STEP_COLORS } from '../types';

type ListViewProps = {
  tasks: ScheduledTask[];
  orders: Order[]; // We'll need orders to get additional details
};

const ListView: React.FC<ListViewProps> = ({ tasks, orders }) => {
  // Create a map of order details for quick lookup
  const orderMap = React.useMemo(() => {
    return orders.reduce((acc, order) => {
      acc[order.id] = order;
      return acc;
    }, {} as Record<string, Order>);
  }, [orders]);

  return (
    <div className="rounded-md border bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-2 text-left font-medium">Task Id</th>
            <th className="px-4 py-2 text-left font-medium">Step</th>
            <th className="px-4 py-2 text-left font-medium">Resource</th>
            <th className="px-4 py-2 text-left font-medium">Start Time</th>
            <th className="px-4 py-2 text-left font-medium">End Time</th>
            <th className="px-4 py-2 text-left font-medium">Product</th>
            <th className="px-4 py-2 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length > 0 ? (
            tasks.map((task) => {
              const order = orderMap[task.orderId];
              return (
                <tr 
                  key={task.id} 
                  className="border-b hover:bg-gray-50"
                >


                  {/* Task ID */}
                  <td className="px-4 py-2">{task.id}</td>

                  {/* Step with color indicator */}

                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <span 
                        className={`inline-block w-3 h-3 rounded-full ${STEP_COLORS[task.step]}`}
                      />
                      <span>{task.step}</span>
                    </div>
                  </td>

                  {/* Customer Name */}
                  <td className="px-4 py-2">
                    {task.resources.join(',') || "N/A"}
                  </td>

                  {/* Start Time */}
                  <td className="px-4 py-2">
                    {task.startTime 
                      ? new Date(task.startTime).toLocaleString() 
                      : "N/A"}
                  </td>

                  {/* End Time */}
                  <td className="px-4 py-2">
                    {task.endTime 
                      ? new Date(task.endTime).toLocaleString() 
                      : "N/A"}
                  </td>

                  {/* Product */}
                  <td className="px-4 py-2">
                    {task.product?.name || "N/A"}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-2">
                    <span 
                      className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                          task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          task.status === 'blocked' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'}
                      `}
                    >
                      {task.status || "N/A"}
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} className="px-4 py-2 text-center text-gray-500">
                No tasks available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ListView;