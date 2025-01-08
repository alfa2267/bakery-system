import React, { useState, useEffect } from 'react';
import { bakeryApi } from '../api/bakeryApi';
import { Order } from '../types';
import { Search, ArrowUpDown } from 'lucide-react';

// Temporary UI component replacements until shadcn/ui components are set up
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type || 'text'}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

const Table = ({ children }: { children: React.ReactNode }) => (
  <table className="w-full border-collapse">{children}</table>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead>{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody>{children}</tbody>
);

const TableRow = ({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={`border-b ${className}`} {...props}>{children}</tr>
);

const TableHead = ({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => (
  <th className={`px-4 py-2 text-left font-medium ${className}`} {...props}>{children}</th>
);

const TableCell = ({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={`px-4 py-2 ${className}`} {...props}>{children}</td>
);

const Button = ({ 
  children, 
  variant = 'default', 
  className, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'default' | 'ghost' 
}) => {
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>{children}</div>
);

const CardTitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>{children}</h3>
);

const CardContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>
);

type SortField = 'id' | 'customerName' | 'deliveryDate' | 'deliverySlot' | 'location';
type SortDirection = 'asc' | 'desc';

const OrderView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('deliveryDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await bakeryApi.getOrders();
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

  const uniqueLocations = ['all', ...Array.from(new Set(orders.map(order => order.location)))];

  const sortOrders = (a: Order, b: Order) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'deliveryDate':
        comparison = new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
        break;
      case 'id':
      case 'customerName':
      case 'deliverySlot':
      case 'location':
        comparison = a[sortField].localeCompare(b[sortField]);
        break;
      default:
        comparison = 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredOrders = orders
    .filter(order => {
      const searchMatch = 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const locationMatch = 
        locationFilter === 'all' || order.location === locationFilter;
      
      return searchMatch && locationMatch;
    })
    .sort(sortOrders);

  const SortButton: React.FC<{ field: SortField; label: string }> = ({ field, label }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-8 px-2 lg:px-3"
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading orders...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  console.log(filteredOrders)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select 
            value={locationFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocationFilter(e.target.value)}
            className="w-full md:w-48"
          >
            {uniqueLocations.map(location => (
              <option key={location} value={location}>
                {location === 'all' ? 'All Locations' : location}
              </option>
            ))}
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortButton field="id" label="Order ID" /></TableHead>
                <TableHead><SortButton field="customerName" label="Customer Name" /></TableHead>
                <TableHead><SortButton field="deliveryDate" label="Delivery Date" /></TableHead>
                <TableHead><SortButton field="deliverySlot" label="Delivery Slot" /></TableHead>
                <TableHead>Items</TableHead>
                <TableHead><SortButton field="location" label="Location" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{new Date(order.deliveryDate).toLocaleDateString()}</TableCell>
                  <TableCell>{order.deliverySlot}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.product.id} className="text-sm">
                          {item.product.name}: {item.quantity}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{order.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderView;