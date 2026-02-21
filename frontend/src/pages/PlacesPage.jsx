import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Input,
  Dropdown,
  Option,
  Badge,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Search24Regular, Map24Regular } from '@fluentui/react-icons';
import { getPlaces } from '../services/api';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '16px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  card: {
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
    ':hover': {
      boxShadow: tokens.shadow8,
    },
  },
  cardBody: {
    padding: '12px 16px',
  },
  detail: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '4px',
  },
  badge: {
    marginTop: '8px',
  },
});

const placeTypes = ['all', 'history', 'fun', 'culture', 'nature', 'shopping', 'food', 'transport', 'other'];

export default function PlacesPage() {
  const styles = useStyles();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchPlaces();
  }, [search, typeFilter]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await getPlaces(params);
      setPlaces(res.data.places);
    } catch (err) {
      console.error('Failed to fetch places:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className={styles.header}>
        <Text size={700} weight="bold">
          <Map24Regular style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Explore Places
        </Text>
        <div className={styles.filters}>
          <Input
            placeholder="Search places..."
            contentBefore={<Search24Regular />}
            value={search}
            onChange={(e, data) => setSearch(data.value)}
            style={{ width: 250 }}
          />
          <Dropdown
            placeholder="Filter by type"
            value={typeFilter}
            onOptionSelect={(e, data) => setTypeFilter(data.optionValue)}
            style={{ minWidth: 150 }}
          >
            {placeTypes.map((t) => (
              <Option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Option>
            ))}
          </Dropdown>
        </div>
      </div>

      {loading ? (
        <Spinner size="large" label="Loading places..." />
      ) : places.length === 0 ? (
        <Text>No places found.</Text>
      ) : (
        <div className="card-grid">
          {places.map((place) => (
            <Card key={place._id} className={styles.card}>
              <CardHeader
                header={<Text weight="semibold" size={400}>{place.name}</Text>}
                description={`${place.city || ''}${place.city && place.country ? ', ' : ''}${place.country}`}
              />
              <div className={styles.cardBody}>
                {place.highlight && <Text size={200} italic>{place.highlight}</Text>}
                <div className={styles.detail}>
                  <Text size={200}>Fee: {place.fee || 'Free'}</Text>
                  <Text size={200}>{place.timeToCover || ''}</Text>
                </div>
                {place.timing && (
                  <Text size={200} block style={{ marginTop: 4 }}>
                    Timing: {place.timing}
                  </Text>
                )}
                {place.notes && (
                  <Text size={200} block style={{ marginTop: 4, color: tokens.colorNeutralForeground3 }}>
                    {place.notes}
                  </Text>
                )}
                <div className={styles.badge}>
                  <Badge appearance="tint" color="brand">{place.type}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
