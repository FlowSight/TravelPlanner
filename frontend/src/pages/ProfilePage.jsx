import { useState } from 'react';
import {
  Card,
  Text,
  Title2,
  Title3,
  Body1,
  Badge,
  Input,
  Button,
  Divider,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  Field,
} from '@fluentui/react-components';
import {
  Person24Regular,
  Mail24Regular,
  Phone24Regular,
  Shield24Regular,
  Key24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { useAuth } from '../context/AuthContext';
import { updatePassword } from '../services/api';

const useStyles = makeStyles({
  container: {
    maxWidth: '640px',
    margin: '40px auto',
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    padding: '28px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
  },
  icon: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  label: {
    color: tokens.colorNeutralForeground3,
    minWidth: '80px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '12px',
  },
});

export default function ProfilePage() {
  const styles = useStyles();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      setLoading(true);
      await updatePassword({ currentPassword, newPassword });
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className={styles.container}>
      {/* Profile Details */}
      <Card className={styles.card}>
        <Title2>Profile</Title2>
        <Divider style={{ margin: '16px 0' }} />

        <div className={styles.row}>
          <Person24Regular className={styles.icon} />
          <Text className={styles.label} size={300}>Name</Text>
          <Body1 weight="semibold">{user.name}</Body1>
        </div>

        {user.email && (
          <div className={styles.row}>
            <Mail24Regular className={styles.icon} />
            <Text className={styles.label} size={300}>Email</Text>
            <Body1>{user.email}</Body1>
          </div>
        )}

        {user.phone && (
          <div className={styles.row}>
            <Phone24Regular className={styles.icon} />
            <Text className={styles.label} size={300}>Phone</Text>
            <Body1>{user.phone}</Body1>
          </div>
        )}

        <div className={styles.row}>
          <Shield24Regular className={styles.icon} />
          <Text className={styles.label} size={300}>Role</Text>
          <Badge
            appearance="filled"
            color={user.role === 'admin' ? 'danger' : 'brand'}
          >
            {user.role}
          </Badge>
        </div>
      </Card>

      {/* Update Password */}
      <Card className={styles.card}>
        <Title3>
          <Key24Regular style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Update Password
        </Title3>
        <Divider style={{ margin: '16px 0' }} />

        {message && (
          <MessageBar
            intent={message.type === 'success' ? 'success' : 'error'}
            style={{ marginBottom: 12 }}
          >
            <MessageBarBody>{message.text}</MessageBarBody>
          </MessageBar>
        )}

        <form onSubmit={handlePasswordUpdate} className={styles.form}>
          <Field label="Current Password" required>
            <Input
              type="password"
              value={currentPassword}
              onChange={(_, d) => setCurrentPassword(d.value)}
              placeholder="Enter current password"
            />
          </Field>

          <Field label="New Password" required>
            <Input
              type="password"
              value={newPassword}
              onChange={(_, d) => setNewPassword(d.value)}
              placeholder="At least 6 characters"
            />
          </Field>

          <Field label="Confirm New Password" required>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(_, d) => setConfirmPassword(d.value)}
              placeholder="Re-enter new password"
            />
          </Field>

          <Button
            appearance="primary"
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            icon={loading ? undefined : <Checkmark24Regular />}
            style={{ alignSelf: 'flex-start', marginTop: 8 }}
          >
            {loading ? 'Updating…' : 'Update Password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
