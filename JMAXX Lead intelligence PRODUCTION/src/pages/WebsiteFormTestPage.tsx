import React, { useState } from 'react';
import { Card, Button, Input, Select } from '../components/ui';
import { CheckCircle, XCircle, Loader2, Send, AlertCircle } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/website-form`;

export function WebsiteFormTestPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    service: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({ success: true, message: data.message || 'Lead created successfully' });
        setFormData({ name: '', phone: '', email: '', city: '', service: '', message: '' });
      } else {
        setResult({ success: false, message: data.error || data.message || 'Failed to submit' });
      }
    } catch (err) {
      setResult({ success: false, message: 'Network error - check webhook URL' });
    }

    setSubmitting(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Website Form Integration</h1>

      <Card className="mb-6 p-4">
        <h2 className="text-lg font-semibold mb-3">Webhook Endpoint</h2>
        <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
          {WEBHOOK_URL}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Submit POST requests with JSON body containing: name, phone, city (required), email, service, message (optional)
        </p>
      </Card>

      <Card className="mb-6 p-4">
        <h2 className="text-lg font-semibold mb-3">Live Test - Submit a Lead</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jean Dupont"
              required
            />
            <Input
              label="Phone *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="079 123 45 67"
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jean@example.com"
            />
            <Input
              label="City *"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Neuchâtel"
              required
            />
            <Input
              label="Service"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              placeholder="Vide-maison"
            />
            <Input
              label="Message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Vente urgente - succession..."
            />
          </div>

          <Button type="submit" disabled={submitting} icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}>
            {submitting ? 'Submitting...' : 'Submit Test Lead'}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {result.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="text-sm font-medium">{result.message}</p>
            </div>
          )}
        </form>
      </Card>

      <Card className="mb-6 p-4">
        <h2 className="text-lg font-semibold mb-3">Example Request</h2>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto">
{`curl -X POST \\
  ${WEBHOOK_URL} \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Jean Dupont",
    "phone": "079 123 45 67",
    "email": "jean@example.com",
    "city": "Neuchâtel",
    "service": "Vide-maison",
    "message": "Vente urgente - succession"
  }'`}
        </pre>
      </Card>

      <Card className="mb-6 p-4">
        <h2 className="text-lg font-semibold mb-3">JavaScript Example</h2>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto">
{`// Website form submission
async function submitForm(formData) {
  const response = await fetch(
    '${WEBHOOK_URL}',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        city: formData.city,
        service: formData.service,
        message: formData.message,
      }),
    }
  );

  return response.json();
}

// HTML Form integration example
document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const result = await submitForm({
    name: document.querySelector('[name="name"]').value,
    phone: document.querySelector('[name="phone"]').value,
    email: document.querySelector('[name="email"]').value,
    city: document.querySelector('[name="city"]').value,
    service: document.querySelector('[name="service"]').value,
    message: document.querySelector('[name="message"]').value,
  });

  if (result.success) {
    alert(result.message);
  }
});`}
        </pre>
      </Card>

      <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
        <h2 className="text-lg font-semibold mb-3 text-blue-800">Pipeline Flow</h2>
        <ol className="space-y-2 text-sm text-blue-700">
          <li>1. Form submitted to webhook</li>
          <li>2. Phone normalized to Swiss format (+41)</li>
          <li>3. Duplicate check (10 min window)</li>
          <li>4. Lead created with source: website</li>
          <li>5. Canton inferred from city</li>
          <li>6. Scoring engine runs (urgency, intent, service keywords)</li>
          <li>7. Classification determined (hot/high/medium/low)</li>
          <li>8. HOT lead alert generated if score &gt;= 80</li>
          <li>9. WhatsApp action prepared</li>
          <li>10. Lead visible in /operations dashboard</li>
        </ol>
      </Card>

      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <h2 className="text-lg font-semibold mb-3 text-yellow-800">Phone Number Formats</h2>
        <div className="text-sm text-yellow-700 space-y-1">
          <p><strong>Accepted formats:</strong></p>
          <ul className="list-disc list-inside ml-2">
            <li>079 123 45 67 → +41791234567</li>
            <li>0041 79 123 45 67 → +41791234567</li>
            <li>+41 79 123 45 67 → +41791234567</li>
            <li>791234567 → +41791234567</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
