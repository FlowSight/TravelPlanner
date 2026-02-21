import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  Button,
  Text,
  Input,
  Textarea,
  Field,
  Dropdown,
  Option,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';
import { getPlaces, createPlace, updatePlace, deletePlace } from '../services/api';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  card: {
    marginBottom: '12px',
    padding: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
});

const placeTypes = ['history', 'fun', 'culture', 'nature', 'shopping', 'food', 'transport', 'accommodation', 'other'];

export default function AdminPlacesPage() {
  const styles = useStyles();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [form, setForm] = useState({
    name: '', country: '', city: '', type: 'other', fee: '',
    googleMapUrl: '', timing: '', timeToCover: '', highlight: '', notes: '',
  });

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await getPlaces({ limit: 200 });
      setPlaces(res.data.places);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '', country: '', city: '', type: 'other', fee: '',
      googleMapUrl: '', timing: '', timeToCover: '', highlight: '', notes: '',
    });
    setEditingPlace(null);
  };

  const openEdit = (place) => {
    setEditingPlace(place);
    setForm({
      name: place.name || '',
      country: place.country || '',
      city: place.city || '',
      type: place.type || 'other',
      fee: place.fee || '',
      googleMapUrl: place.googleMapUrl || '',
      timing: place.timing || '',
      timeToCover: place.timeToCover || '',
      highlight: place.highlight || '',
      notes: place.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingPlace) {
        await updatePlace(editingPlace._id, form);
      } else {
        await createPlace(form);
      }
      setDialogOpen(false);
      resetForm();
      fetchPlaces();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this place?')) return;
    try {
      await deletePlace(id);
      fetchPlaces();
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (field) => (e, data) => {
    setForm((p) => ({ ...p, [field]: data.value ?? data.optionValue }));
  };

  return (
    <div>
      <div className={styles.header}>
        <Text size={500} weight="semibold">Places</Text>
        <Dialog open={dialogOpen} onOpenChange={(e, data) => { setDialogOpen(data.open); if (!data.open) resetForm(); }}>
          <DialogTrigger disableButtonEnhancement>
            <Button icon={<Add24Regular />} appearance="primary">Add Place</Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>{editingPlace ? 'Edit Place' : 'Add New Place'}</DialogTitle>
              <DialogContent>
                <div className={styles.form}>
                  <Field label="Name" required>
                    <Input value={form.name} onChange={handleChange('name')} />
                  </Field>
                  <Field label="Country" required>
                    <Input value={form.country} onChange={handleChange('country')} />
                  </Field>
                  <Field label="City">
                    <Input value={form.city} onChange={handleChange('city')} />
                  </Field>
                  <Field label="Type">
                    <Dropdown value={form.type} onOptionSelect={(e, data) => setForm((p) => ({ ...p, type: data.optionValue }))}>
                      {placeTypes.map((t) => (
                        <Option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</Option>
                      ))}
                    </Dropdown>
                  </Field>
                  <Field label="Fee"><Input value={form.fee} onChange={handleChange('fee')} /></Field>
                  <Field label="Google Map URL"><Input value={form.googleMapUrl} onChange={handleChange('googleMapUrl')} /></Field>
                  <Field label="Timing"><Input value={form.timing} onChange={handleChange('timing')} /></Field>
                  <Field label="Time to Cover"><Input value={form.timeToCover} onChange={handleChange('timeToCover')} /></Field>
                  <Field label="Highlight"><Input value={form.highlight} onChange={handleChange('highlight')} /></Field>
                  <Field label="Notes"><Textarea value={form.notes} onChange={handleChange('notes')} rows={3} /></Field>
                </div>
              </DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary">Cancel</Button>
                </DialogTrigger>
                <Button appearance="primary" onClick={handleSave} disabled={!form.name || !form.country}>
                  {editingPlace ? 'Update' : 'Create'}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>

      {loading ? (
        <Spinner size="large" label="Loading..." />
      ) : places.length === 0 ? (
        <Text>No places in the database. Add some!</Text>
      ) : (
        places.map((place) => (
          <Card key={place._id} className={styles.card}>
            <CardHeader
              header={<Text weight="semibold">{place.name}</Text>}
              description={`${place.city || ''}${place.city && place.country ? ', ' : ''}${place.country} — ${place.type}`}
              action={
                <div className={styles.actions}>
                  <Button icon={<Edit24Regular />} size="small" appearance="subtle" onClick={() => openEdit(place)}>
                    Edit
                  </Button>
                  <Button icon={<Delete24Regular />} size="small" appearance="subtle" onClick={() => handleDelete(place._id)}>
                    Delete
                  </Button>
                </div>
              }
            />
            {place.highlight && <Text size={200}>{place.highlight}</Text>}
          </Card>
        ))
      )}
    </div>
  );
}
