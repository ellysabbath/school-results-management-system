// src/pages/Settings.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, User, School, Mail, Phone, MapPin, CreditCard, Home } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Settings: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mipangilio</h1>
            <p className="text-sm text-gray-500">Simamia taarifa za shule na akaunti yako</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* School Information */}
          <Card title="Taarifa za Shule" icon={<School className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Jina la Shule" defaultValue="Shule ya Sekondari Tanzania" />
              <Input label="Anwani" defaultValue="Dar es Salaam, Tanzania" icon={MapPin} />
              <Input label="Namba ya Simu" defaultValue="+255 712 345 678" icon={Phone} />
              <Input label="Barua Pepe" defaultValue="info@shule.com" icon={Mail} />
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="primary">Hifadhi Mabadiliko</Button>
              <Button variant="secondary">Ghairi</Button>
            </div>
          </Card>

          {/* User Information */}
          <Card title="Taarifa za Mwalimu" icon={<User className="w-5 h-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Jina Kamili" defaultValue="Mwalimu John" />
              <Input label="Wadhifa" defaultValue="Admin" />
              <Input label="Barua Pepe" defaultValue="mwalimu@shule.com" icon={Mail} />
              <Input label="Namba ya Simu" defaultValue="+255 712 345 678" icon={Phone} />
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="primary">Hifadhi Mabadiliko</Button>
              <Button variant="secondary">Ghairi</Button>
            </div>
          </Card>

          {/* Subscription */}
          <Card title="Usajili" icon={<CreditCard className="w-5 h-5" />}>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500">Mpango wa sasa</p>
                  <p className="text-xl font-bold text-gray-800">Premium</p>
                  <p className="text-sm text-gray-500">Inaisha: 30 siku zimesalia</p>
                </div>
                <Link to="/payment">
                  <Button variant="success" icon={CreditCard}>
                    Nyongeza Usajili
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Link to="/dashboard">
              <Button variant="secondary" icon={Home}>
                Rudi Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;