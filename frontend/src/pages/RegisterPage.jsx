import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  Input,
  Button,
  Text,
  Field,
  makeStyles,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/api';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 56px)',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '16px',
  },
  linkText: {
    marginTop: '16px',
    textAlign: 'center',
  },
});

export default function RegisterPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e, data) => {
    setForm((prev) => ({ ...prev, [field]: data.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register(form);
      loginUser(res.data.token, res.data.user);
      navigate('/trips');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={<Text size={600} weight="bold">Register</Text>}
          description="Create your Travel Planner account"
        />
        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <Field label="Name" required>
            <Input value={form.name} onChange={handleChange('name')} placeholder="Your name" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={handleChange('email')} placeholder="you@example.com" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={handleChange('phone')} placeholder="+91 1234567890" />
          </Field>
          <Field label="Password" required>
            <Input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="Min 6 characters"
            />
          </Field>
          <Button appearance="primary" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <div className={styles.linkText}>
          <Text>Already have an account? <Link to="/login">Login</Link></Text>
        </div>
      </Card>
    </div>
  );
}
