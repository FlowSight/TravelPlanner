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
  tokens,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';

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

export default function LoginPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({ email, password });
      loginUser(res.data.token, res.data.user);
      navigate('/trips');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={<Text size={600} weight="bold">Login</Text>}
          description="Sign in to your Travel Planner account"
        />
        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <Field label="Email" required>
            <Input
              type="email"
              value={email}
              onChange={(e, data) => setEmail(data.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password" required>
            <Input
              type="password"
              value={password}
              onChange={(e, data) => setPassword(data.value)}
              placeholder="Enter password"
            />
          </Field>
          <Button appearance="primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </Button>
        </form>
        <div className={styles.linkText}>
          <Text>Don't have an account? <Link to="/register">Register</Link></Text>
        </div>
      </Card>
    </div>
  );
}
