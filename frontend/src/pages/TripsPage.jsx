import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  Button,
  Text,
  Badge,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Textarea,
  Field,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Airplane24Regular,
  Calendar24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';
import { getTrips, createTrip, deleteTrip } from '../services/api';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  card: {
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
    ':hover': {
      boxShadow: tokens.shadow8,
    },
  },
  cardBody: {
    padding: '8px 16px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statusBadge: {
    textTransform: 'capitalize',
  },
});

const statusColors = {
  planning: 'informative',
  confirmed: 'success',
  ongoing: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export default function TripsPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({ title: '', destination: '', description: '', startDate: '', endDate: '' });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await getTrips();
      setTrips(res.data.trips);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await createTrip(newTrip);
      setDialogOpen(false);
      setNewTrip({ title: '', destination: '', description: '', startDate: '', endDate: '' });
      fetchTrips();
    } catch (err) {
      console.error('Failed to create trip:', err);
    }
  };

  const handleDelete = async (e, tripId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await deleteTrip(tripId);
        fetchTrips();
      } catch (err) {
        console.error('Failed to delete trip:', err);
      }
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  return (
    <div className="page-container">
      <div className={styles.header}>
        <Text size={700} weight="bold">
          <Airplane24Regular style={{ verticalAlign: 'middle', marginRight: 8 }} />
          My Trips
        </Text>
        <Dialog open={dialogOpen} onOpenChange={(e, data) => setDialogOpen(data.open)}>
          <DialogTrigger disableButtonEnhancement>
            <Button appearance="primary" icon={<Add24Regular />}>
              New Trip
            </Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Create New Trip</DialogTitle>
              <DialogContent>
                <div className={styles.form}>
                  <Field label="Trip Title" required>
                    <Input
                      value={newTrip.title}
                      onChange={(e, data) => setNewTrip((p) => ({ ...p, title: data.value }))}
                      placeholder="e.g. Thailand Bangkok & Pattaya"
                    />
                  </Field>
                  <Field label="Destination">
                    <Input
                      value={newTrip.destination}
                      onChange={(e, data) => setNewTrip((p) => ({ ...p, destination: data.value }))}
                      placeholder="e.g. Bangkok, Pattaya"
                    />
                  </Field>
                  <Field label="Description">
                    <Textarea
                      value={newTrip.description}
                      onChange={(e, data) => setNewTrip((p) => ({ ...p, description: data.value }))}
                      placeholder="Brief description of the trip"
                    />
                  </Field>
                  <Field label="Start Date">
                    <Input
                      type="date"
                      value={newTrip.startDate}
                      onChange={(e, data) => setNewTrip((p) => ({ ...p, startDate: data.value }))}
                    />
                  </Field>
                  <Field label="End Date">
                    <Input
                      type="date"
                      value={newTrip.endDate}
                      onChange={(e, data) => setNewTrip((p) => ({ ...p, endDate: data.value }))}
                    />
                  </Field>
                </div>
              </DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary">Cancel</Button>
                </DialogTrigger>
                <Button appearance="primary" onClick={handleCreate} disabled={!newTrip.title}>
                  Create
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>

      {loading ? (
        <Spinner size="large" label="Loading trips..." />
      ) : trips.length === 0 ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <Text size={400}>No trips yet. Create your first trip!</Text>
        </Card>
      ) : (
        <div className="card-grid">
          {trips.map((trip) => (
            <Card key={trip._id} className={styles.card} onClick={() => navigate(`/trips/${trip._id}`)}>
              <CardHeader
                header={<Text weight="semibold" size={400}>{trip.title}</Text>}
                description={trip.destination || 'No destination set'}
              />
              <div className={styles.cardBody}>
                <div>
                  <Text size={200}>
                    <Calendar24Regular style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge
                    appearance="tint"
                    color={statusColors[trip.status] || 'informative'}
                    className={styles.statusBadge}
                  >
                    {trip.status}
                  </Badge>
                  <Button
                    icon={<Delete24Regular />}
                    appearance="subtle"
                    size="small"
                    onClick={(e) => handleDelete(e, trip._id)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
