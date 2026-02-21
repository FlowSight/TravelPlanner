import { useState } from 'react';
import {
  Dropdown,
  Option,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Settings24Regular } from '@fluentui/react-icons';
import AdminPlacesPage from './AdminPlacesPage';

const useStyles = makeStyles({
  container: {
    padding: '24px 32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dropdown: {
    minWidth: '180px',
  },
});

const MANAGE_OPTIONS = [
  { key: 'places', label: 'Places' },
];

export default function ManagePage() {
  const styles = useStyles();
  const [selected, setSelected] = useState('places');

  const renderContent = () => {
    switch (selected) {
      case 'places':
        return <AdminPlacesPage />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Settings24Regular />
          <Text size={700} weight="bold">Manage</Text>
        </div>
        <Dropdown
          className={styles.dropdown}
          value={MANAGE_OPTIONS.find((o) => o.key === selected)?.label}
          selectedOptions={[selected]}
          onOptionSelect={(_, data) => setSelected(data.optionValue)}
        >
          {MANAGE_OPTIONS.map((opt) => (
            <Option key={opt.key} value={opt.key}>
              {opt.label}
            </Option>
          ))}
        </Dropdown>
      </div>
      {renderContent()}
    </div>
  );
}
