import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  Button,
  Text,
  Input,
  Textarea,
  Field,
  Badge,
  Spinner,
  Tab,
  TabList,
  Divider,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Dropdown,
  Option,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  Add24Regular,
  Save24Regular,
  Delete24Regular,
  Document24Regular,
  Calendar24Regular,
  People24Regular,
  Edit24Regular,
  Location24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import {
  getTrip,
  updateTrip,
  addTripMember,
  removeTripMember,
  searchUsers,
  getPlaces,
  addTripPlace,
  addCustomTripPlace,
  removeTripPlace,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  section: {
    marginTop: '24px',
  },
  dayCard: {
    marginBottom: '16px',
    padding: '16px',
  },
  activityRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '8px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  docCard: {
    padding: '12px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  placeSearchContainer: {
    position: 'relative',
  },
  placeResults: {
    maxHeight: '200px',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: '4px',
  },
  placeResultItem: {
    padding: '8px 12px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  placeChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusCircular,
    marginTop: '4px',
  },
  placeInfo: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginTop: '2px',
    flexWrap: 'wrap',
  },
});

export default function TripDetailPage() {
  const styles = useStyles();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [saving, setSaving] = useState(false);

  // Itinerary editing
  const [editingNotes, setEditingNotes] = useState('');



  // Activity dialog (shared for add / edit)
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityDayIndex, setActivityDayIndex] = useState(0);
  const [newActivity, setNewActivity] = useState({ time: '', endTime: '', placeName: '', description: '', notes: '' });
  const [activityMode, setActivityMode] = useState('add'); // 'add' | 'edit'
  const [editActivityIndex, setEditActivityIndex] = useState(null);

  // Place search inside activity dialog
  const [placeSearch, setPlaceSearch] = useState('');
  const [placeResults, setPlaceResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeSearching, setPlaceSearching] = useState(false);

  // New document dialog
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', url: '', type: 'other', notes: '' });

  // Add member dialog
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState([]);

  // Edit trip dialog
  const [editTripOpen, setEditTripOpen] = useState(false);
  const [editTripForm, setEditTripForm] = useState({});

  // Trip places list search
  const [tripPlaceSearch, setTripPlaceSearch] = useState('');
  const [tripPlaceResults, setTripPlaceResults] = useState([]);
  const [tripPlaceSearching, setTripPlaceSearching] = useState(false);

  // Custom place form
  const [customPlaceOpen, setCustomPlaceOpen] = useState(false);
  const [customPlaceForm, setCustomPlaceForm] = useState({ name: '', city: '', country: '', type: '', notes: '', googleMapUrl: '' });

  useEffect(() => {
    fetchTrip();
  }, [id]);

  useEffect(() => {
    if (trip) setEditingNotes(trip.notes || '');
  }, [trip]);

  const fetchTrip = async () => {
    setLoading(true);
    try {
      const res = await getTrip(id);
      setTrip(res.data.trip);
    } catch (err) {
      console.error('Failed to fetch trip:', err);
    } finally {
      setLoading(false);
    }
  };

  // Convert populated place objects back to plain IDs for saving
  const serializeActivities = (activities) =>
    (activities || []).map((act) => ({
      time: act.time,
      endTime: act.endTime,
      placeName: act.placeName,
      description: act.description,
      notes: act.notes,
      ...(act.place
        ? { place: typeof act.place === 'object' ? act.place._id : act.place }
        : {}),
    }));

  const serializeItinerary = (itinerary) =>
    (itinerary || trip.itinerary || []).map((day) => ({
      ...day,
      activities: serializeActivities(day.activities),
    }));

  const saveTrip = async (updates) => {
    setSaving(true);
    try {
      await updateTrip(id, updates);
      await fetchTrip(); // re-fetch to get full place population
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Day helpers ────────────────────────────────────────

  /** Compute the date string for a given dayNumber based on a start date */
  const dateForDay = (dayNumber, startDate) => {
    const s = startDate || trip?.startDate;
    if (!s) return '';
    const d = new Date(s);
    d.setDate(d.getDate() + dayNumber - 1);
    return d.toISOString().slice(0, 10);
  };

  /** Build the canonical itinerary array from trip dates, preserving existing activities/themes */
  const buildItinerary = (startDate, endDate, existingDays) => {
    if (!startDate || !endDate) return existingDays || [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const count = Math.max(0, Math.round((end - start) / 86400000) + 1);
    const days = [];
    for (let i = 1; i <= count; i++) {
      const existing = (existingDays || []).find((d) => d.dayNumber === i);
      days.push({
        dayNumber: i,
        theme: existing?.theme || '',
        date: dateForDay(i, startDate),
        activities: existing?.activities || [],
      });
    }
    return days;
  };

  /** The itinerary to display — always derived from trip dates */
  const displayItinerary = (() => {
    if (!trip) return [];
    if (trip.startDate && trip.endDate) {
      return buildItinerary(trip.startDate, trip.endDate, trip.itinerary);
    }
    return trip.itinerary || [];
  })();

  // ─── Activity handlers ──────────────────────────────────

  const openAddActivity = (dayIndex) => {
    setActivityMode('add');
    setActivityDayIndex(dayIndex);
    setEditActivityIndex(null);
    setNewActivity({ time: '', endTime: '', placeName: '', description: '', notes: '' });
    setSelectedPlace(null);
    setPlaceSearch('');
    setPlaceResults([]);
    setActivityDialogOpen(true);
  };

  const openEditActivity = (dayIndex, actIndex) => {
    const act = displayItinerary[dayIndex].activities[actIndex];
    setActivityMode('edit');
    setActivityDayIndex(dayIndex);
    setEditActivityIndex(actIndex);
    setNewActivity({
      time: act.time || '',
      endTime: act.endTime || '',
      placeName: act.placeName || '',
      description: act.description || '',
      notes: act.notes || '',
    });
    setSelectedPlace(act.place && typeof act.place === 'object' ? act.place : null);
    setPlaceSearch('');
    setPlaceResults([]);
    setActivityDialogOpen(true);
  };

  const handleSaveActivity = async () => {
    const itinerary = serializeItinerary(displayItinerary);
    const actData = {
      time: newActivity.time,
      endTime: newActivity.endTime,
      placeName: newActivity.placeName,
      description: newActivity.description,
      notes: newActivity.notes,
    };
    if (selectedPlace) {
      actData.place = selectedPlace._id;
    }

    if (activityMode === 'edit' && editActivityIndex !== null) {
      itinerary[activityDayIndex].activities[editActivityIndex] = actData;
    } else {
      if (!itinerary[activityDayIndex].activities) {
        itinerary[activityDayIndex].activities = [];
      }
      itinerary[activityDayIndex].activities.push(actData);
    }

    await saveTrip({ itinerary });

    // Auto-add place to trip places list if linking a place
    if (selectedPlace) {
      try {
        await addTripPlace(id, selectedPlace._id);
      } catch (err) {
        // Ignore — place may already be in list
      }
    }

    await fetchTrip();
    setActivityDialogOpen(false);
    setNewActivity({ time: '', endTime: '', placeName: '', description: '', notes: '' });
    setSelectedPlace(null);
  };

  const handleDeleteActivity = async (dayIndex, actIndex) => {
    const itinerary = serializeItinerary(displayItinerary);
    itinerary[dayIndex].activities.splice(actIndex, 1);
    await saveTrip({ itinerary });
  };

  // ─── Place search (inside activity dialog) ─────────────

  const handlePlaceSearch = async (query) => {
    setPlaceSearch(query);
    if (query.length >= 2) {
      setPlaceSearching(true);
      try {
        const res = await getPlaces({ search: query, limit: 10 });
        setPlaceResults(res.data.places);
      } catch (err) {
        console.error(err);
      } finally {
        setPlaceSearching(false);
      }
    } else {
      setPlaceResults([]);
    }
  };

  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
    setNewActivity((prev) => ({ ...prev, placeName: place.name }));
    setPlaceSearch('');
    setPlaceResults([]);
  };

  // ─── Trip places list ──────────────────────────────────

  const handleTripPlaceSearch = async (query) => {
    setTripPlaceSearch(query);
    if (query.length >= 2) {
      setTripPlaceSearching(true);
      try {
        const res = await getPlaces({ search: query, limit: 10 });
        setTripPlaceResults(res.data.places);
      } catch (err) {
        console.error(err);
      } finally {
        setTripPlaceSearching(false);
      }
    } else {
      setTripPlaceResults([]);
    }
  };

  const handleAddTripPlace = async (placeId) => {
    try {
      await addTripPlace(id, placeId);
      await fetchTrip();
      setTripPlaceSearch('');
      setTripPlaceResults([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTripPlace = async (placeId) => {
    try {
      await removeTripPlace(id, placeId);
      await fetchTrip();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCustomPlace = async () => {
    if (!customPlaceForm.name.trim() || !customPlaceForm.googleMapUrl.trim()) return;
    try {
      await addCustomTripPlace(id, customPlaceForm);
      await fetchTrip();
      setCustomPlaceForm({ name: '', city: '', country: '', type: '', notes: '', googleMapUrl: '' });
      setCustomPlaceOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Notes ──────────────────────────────────────────────

  const handleSaveNotes = async () => {
    await saveTrip({ notes: editingNotes });
  };

  // ─── Documents ──────────────────────────────────────────

  const handleAddDoc = async () => {
    const documents = [...(trip.documents || []), newDoc];
    await saveTrip({ documents });
    setDocDialogOpen(false);
    setNewDoc({ title: '', url: '', type: 'other', notes: '' });
  };

  const handleDeleteDoc = async (docIndex) => {
    const documents = trip.documents.filter((_, i) => i !== docIndex);
    await saveTrip({ documents });
  };

  // ─── Members ────────────────────────────────────────────

  const handleSearchMembers = async (q) => {
    setMemberSearch(q);
    if (q.length >= 2) {
      try {
        const res = await searchUsers(q);
        setMemberResults(res.data.users);
      } catch (err) {
        console.error(err);
      }
    } else {
      setMemberResults([]);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      await addTripMember(id, { userId, role: 'editor' });
      fetchTrip();
      setMemberDialogOpen(false);
      setMemberSearch('');
      setMemberResults([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await removeTripMember(id, userId);
      fetchTrip();
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Edit trip details ─────────────────────────────────

  const openEditTrip = () => {
    setEditTripForm({
      title: trip.title || '',
      destination: trip.destination || '',
      description: trip.description || '',
      startDate: trip.startDate
        ? new Date(trip.startDate).toISOString().slice(0, 10)
        : '',
      endDate: trip.endDate
        ? new Date(trip.endDate).toISOString().slice(0, 10)
        : '',
      status: trip.status || 'planning',
    });
    setEditTripOpen(true);
  };

  const handleSaveTripDetails = async () => {
    const updates = { ...editTripForm };
    // If dates changed, rebuild itinerary to match new date range
    const oldStart = trip.startDate ? new Date(trip.startDate).toISOString().slice(0, 10) : '';
    const oldEnd = trip.endDate ? new Date(trip.endDate).toISOString().slice(0, 10) : '';
    if (updates.startDate && updates.endDate &&
        (updates.startDate !== oldStart || updates.endDate !== oldEnd)) {
      updates.itinerary = buildItinerary(
        updates.startDate,
        updates.endDate,
        serializeItinerary(displayItinerary)
      );
    }
    await saveTrip(updates);
    setEditTripOpen(false);
  };

  // ─── Loading / not found ────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
        <Spinner size="large" label="Loading trip..." />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="page-container">
        <Text>Trip not found or access denied.</Text>
      </div>
    );
  }

  const isOwner = trip.owner?._id === user?.id;
  const canEdit = isOwner || trip.members?.some((m) => m.user?._id === user?.id && m.role === 'editor');

  return (
    <div className="page-container">
      {/* ─── Header ───────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <Button icon={<ArrowLeft24Regular />} appearance="subtle" onClick={() => navigate('/trips')}>
            Back
          </Button>
          <Text size={700} weight="bold" block style={{ marginTop: 8 }}>
            {trip.title}
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            {trip.destination || 'No destination'} &middot;{' '}
            <Calendar24Regular style={{ verticalAlign: 'middle' }} />{' '}
            {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : '—'} —{' '}
            {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : '—'}
          </Text>
          {trip.description && (
            <Text size={200} block style={{ marginTop: 4, color: tokens.colorNeutralForeground3 }}>
              {trip.description}
            </Text>
          )}
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Badge appearance="tint" color="brand" style={{ textTransform: 'capitalize' }}>
              {trip.status}
            </Badge>
            {canEdit && (
              <Button icon={<Edit24Regular />} appearance="subtle" size="small" onClick={openEditTrip}>
                Edit
              </Button>
            )}
          </div>
        </div>
        {saving && <Spinner size="tiny" label="Saving..." />}
      </div>

      {/* ─── Tabs ─────────────────────────────────── */}
      <TabList selectedValue={activeTab} onTabSelect={(e, data) => setActiveTab(data.value)}>
        <Tab value="itinerary">Itinerary</Tab>
        <Tab value="places">Places</Tab>
        <Tab value="notes">Notes</Tab>
        <Tab value="documents">Documents</Tab>
        <Tab value="members">Members</Tab>
      </TabList>

      <Divider style={{ marginTop: 8 }} />

      {/* ═══════════ Itinerary Tab ═══════════ */}
      {activeTab === 'itinerary' && (
        <div className={styles.section}>
          {displayItinerary.length === 0 ? (
            <Text>
              {trip.startDate && trip.endDate
                ? 'No days in the itinerary yet.'
                : 'Set trip start and end dates to generate the itinerary.'}
            </Text>
          ) : (
            displayItinerary
              .sort((a, b) => a.dayNumber - b.dayNumber)
              .map((day, dayIndex) => (
                <Card key={day.dayNumber} className={styles.dayCard}>
                  <CardHeader
                    header={
                      <Text weight="semibold" size={500}>
                        Day {day.dayNumber}{day.theme ? ` — ${day.theme}` : ''}
                      </Text>
                    }
                    description={day.date ? new Date(day.date).toLocaleDateString() : ''}
                    action={
                      canEdit && (
                        <Button
                          icon={<Add24Regular />}
                          size="small"
                          appearance="subtle"
                          onClick={() => openAddActivity(dayIndex)}
                        >
                          Activity
                        </Button>
                      )
                    }
                  />

                  {day.activities && day.activities.length > 0 ? (
                    day.activities.map((act, actIndex) => (
                      <div key={actIndex} className={styles.activityRow}>
                        <Text weight="semibold" size={200} style={{ minWidth: 100 }}>
                          {act.time ? (act.endTime ? `${act.time} – ${act.endTime}` : act.time) : '—'}
                        </Text>
                        <div style={{ flex: 1 }}>
                          <Text weight="semibold">{act.placeName || 'Untitled'}</Text>
                          {act.place && typeof act.place === 'object' && (
                            <div className={styles.placeInfo}>
                              <Badge appearance="tint" size="small" style={{ textTransform: 'capitalize' }}>
                                {act.place.type}
                              </Badge>
                              {act.place.city && (
                                <Text size={200}>
                                  {act.place.city}, {act.place.country}
                                </Text>
                              )}
                              {act.place.fee && act.place.fee !== 'Free' && (
                                <Text size={200}>Fee: {act.place.fee}</Text>
                              )}
                              {act.place.timing && <Text size={200}>{act.place.timing}</Text>}
                              {act.place.googleMapUrl && (
                                <a href={act.place.googleMapUrl} target="_blank" rel="noopener noreferrer">
                                  <Button icon={<Location24Regular />} size="small" appearance="subtle">
                                    Map
                                  </Button>
                                </a>
                              )}
                            </div>
                          )}
                          {act.description && (
                            <Text size={200} block>
                              {act.description}
                            </Text>
                          )}
                          {act.notes && (
                            <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                              {act.notes}
                            </Text>
                          )}
                        </div>
                        {canEdit && (
                          <div style={{ display: 'flex', gap: 2 }}>
                            <Button
                              icon={<Edit24Regular />}
                              size="small"
                              appearance="subtle"
                              onClick={() => openEditActivity(dayIndex, actIndex)}
                            />
                            <Button
                              icon={<Delete24Regular />}
                              size="small"
                              appearance="subtle"
                              onClick={() => handleDeleteActivity(dayIndex, actIndex)}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <Text size={200} style={{ padding: '8px 0', color: tokens.colorNeutralForeground3 }}>
                      No activities yet
                    </Text>
                  )}
                </Card>
              ))
          )}

          {/* Add / Edit Activity Dialog */}
          <Dialog open={activityDialogOpen} onOpenChange={(e, data) => setActivityDialogOpen(data.open)}>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>
                  {activityMode === 'edit' ? 'Edit Activity' : 'Add Activity'}
                </DialogTitle>
                <DialogContent>
                  <div className={styles.form}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Field label="Start Time" style={{ flex: 1 }}>
                        <Input
                          value={newActivity.time}
                          onChange={(e, data) => setNewActivity((p) => ({ ...p, time: data.value }))}
                          placeholder="e.g. 9:00 AM"
                        />
                      </Field>
                      <Field label="End Time" style={{ flex: 1 }}>
                        <Input
                          value={newActivity.endTime}
                          onChange={(e, data) => setNewActivity((p) => ({ ...p, endTime: data.value }))}
                          placeholder="e.g. 11:00 AM"
                        />
                      </Field>
                    </div>

                    {/* Place picker */}
                    <Field label="Link a Place (optional)">
                      {selectedPlace ? (
                        <div className={styles.placeChip}>
                          <Location24Regular />
                          <div>
                            <Text weight="semibold">{selectedPlace.name}</Text>
                            {selectedPlace.city && (
                              <Text size={200} block>
                                {selectedPlace.city}, {selectedPlace.country}
                              </Text>
                            )}
                          </div>
                          <Button
                            icon={<Dismiss24Regular />}
                            size="small"
                            appearance="subtle"
                            onClick={() => {
                              setSelectedPlace(null);
                              setNewActivity((p) => ({ ...p, placeName: '' }));
                            }}
                          />
                        </div>
                      ) : (
                        <div className={styles.placeSearchContainer}>
                          <Input
                            value={placeSearch}
                            onChange={(e, data) => handlePlaceSearch(data.value)}
                            placeholder="Search places by name..."
                            contentAfter={placeSearching ? <Spinner size="tiny" /> : undefined}
                          />
                          {placeResults.length > 0 && (
                            <div className={styles.placeResults}>
                              {placeResults.map((p) => (
                                <div
                                  key={p._id}
                                  className={styles.placeResultItem}
                                  onClick={() => handleSelectPlace(p)}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <div>
                                    <Text weight="semibold">{p.name}</Text>
                                    <Text size={200} block>
                                      {[p.city, p.country].filter(Boolean).join(', ')}
                                    </Text>
                                  </div>
                                  <Badge appearance="tint" size="small" style={{ textTransform: 'capitalize' }}>
                                    {p.type}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Field>

                    <Field
                      label="Place Name"
                      hint={selectedPlace ? 'Auto-filled from selected place' : ''}
                    >
                      <Input
                        value={newActivity.placeName}
                        onChange={(e, data) => setNewActivity((p) => ({ ...p, placeName: data.value }))}
                        placeholder="e.g. Wat Phra Kaew"
                      />
                    </Field>

                    <Field label="Description">
                      <Textarea
                        value={newActivity.description}
                        onChange={(e, data) => setNewActivity((p) => ({ ...p, description: data.value }))}
                        placeholder="What will you do here?"
                      />
                    </Field>
                    <Field label="Notes">
                      <Input
                        value={newActivity.notes}
                        onChange={(e, data) => setNewActivity((p) => ({ ...p, notes: data.value }))}
                        placeholder="Any tips or reminders"
                      />
                    </Field>
                  </div>
                </DialogContent>
                <DialogActions>
                  <DialogTrigger disableButtonEnhancement>
                    <Button appearance="secondary">Cancel</Button>
                  </DialogTrigger>
                  <Button appearance="primary" onClick={handleSaveActivity}>
                    {activityMode === 'edit' ? 'Save' : 'Add'}
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </div>
      )}

      {/* ═══════════ Places Tab ═══════════ */}
      {activeTab === 'places' && (
        <div className={styles.section}>
          <Text size={500} weight="semibold">Trip Places</Text>
          <Text style={{ display: 'block', marginBottom: 12 }}>
            Your curated list of places to visit on this trip.
          </Text>

          {canEdit && (
            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Search & add from global places">
                <Input
                  placeholder="Search places..."
                  value={tripPlaceSearch}
                  onChange={(e, data) => handleTripPlaceSearch(data.value)}
                />
              </Field>
              {tripPlaceSearching && <Spinner size="tiny" label="Searching..." />}
              {tripPlaceResults.length > 0 && (
                <div style={{ border: '1px solid #e0e0e0', borderRadius: 6, marginTop: 4, maxHeight: 220, overflowY: 'auto' }}>
                  {tripPlaceResults.map((p) => {
                    const alreadyAdded = trip.places?.some(
                      (tp) => (tp._id || tp) === p._id
                    );
                    return (
                      <div
                        key={p._id}
                        className={styles.placeResultItem}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div>
                          <Text weight="semibold">{p.name}</Text>
                          <Text size={200} style={{ marginLeft: 8 }}>
                            {[p.city, p.country].filter(Boolean).join(', ')}
                          </Text>
                          {p.type && (
                            <Badge appearance="outline" style={{ marginLeft: 8 }}>{p.type}</Badge>
                          )}
                        </div>
                        <Button
                          size="small"
                          appearance="primary"
                          disabled={alreadyAdded}
                          onClick={() => handleAddTripPlace(p._id)}
                        >
                          {alreadyAdded ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <Divider />

              <Button
                icon={<Add24Regular />}
                appearance="outline"
                onClick={() => setCustomPlaceOpen(true)}
              >
                Add Custom Place
              </Button>

              <Dialog open={customPlaceOpen} onOpenChange={(e, data) => { if (!data.open) { setCustomPlaceOpen(false); setCustomPlaceForm({ name: '', city: '', country: '', type: '', notes: '', googleMapUrl: '' }); } }}>
                <DialogSurface>
                  <DialogBody>
                    <DialogTitle>Add Custom Place</DialogTitle>
                    <DialogContent>
                      <div className={styles.form}>
                        <Field label="Name" required>
                          <Input
                            value={customPlaceForm.name}
                            onChange={(e, data) => setCustomPlaceForm((p) => ({ ...p, name: data.value }))}
                            placeholder="Place name"
                          />
                        </Field>
                        <Field label="Google Maps URL" required>
                          <Input
                            value={customPlaceForm.googleMapUrl}
                            onChange={(e, data) => setCustomPlaceForm((p) => ({ ...p, googleMapUrl: data.value }))}
                            placeholder="https://maps.google.com/..."
                          />
                        </Field>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Field label="City" style={{ flex: 1 }}>
                            <Input
                              value={customPlaceForm.city}
                              onChange={(e, data) => setCustomPlaceForm((p) => ({ ...p, city: data.value }))}
                            />
                          </Field>
                          <Field label="Country" style={{ flex: 1 }}>
                            <Input
                              value={customPlaceForm.country}
                              onChange={(e, data) => setCustomPlaceForm((p) => ({ ...p, country: data.value }))}
                            />
                          </Field>
                        </div>
                        <Field label="Type" required>
                          <Dropdown
                            value={customPlaceForm.type}
                            selectedOptions={customPlaceForm.type ? [customPlaceForm.type] : []}
                            onOptionSelect={(e, data) => setCustomPlaceForm((p) => ({ ...p, type: data.optionValue }))}
                            placeholder="Select type"
                          >
                            <Option value="hotel">Hotel</Option>
                            <Option value="attraction">Attraction</Option>
                            <Option value="airport">Airport</Option>
                            <Option value="station">Station</Option>
                            <Option value="restaurant">Restaurant</Option>
                            <Option value="shopping">Shopping</Option>
                            <Option value="temple">Temple</Option>
                            <Option value="beach">Beach</Option>
                            <Option value="other">Other</Option>
                          </Dropdown>
                        </Field>
                        <Field label="Notes">
                          <Input
                            value={customPlaceForm.notes}
                            onChange={(e, data) => setCustomPlaceForm((p) => ({ ...p, notes: data.value }))}
                          />
                        </Field>
                      </div>
                    </DialogContent>
                    <DialogActions>
                      <DialogTrigger disableButtonEnhancement>
                        <Button appearance="secondary">Cancel</Button>
                      </DialogTrigger>
                      <Button appearance="primary" onClick={handleAddCustomPlace} disabled={!customPlaceForm.name.trim() || !customPlaceForm.googleMapUrl.trim()}>Add</Button>
                    </DialogActions>
                  </DialogBody>
                </DialogSurface>
              </Dialog>
            </div>
          )}

          {(!trip.places || trip.places.length === 0) && (
            <Text italic style={{ color: '#888' }}>No places added yet.</Text>
          )}

          {trip.places && trip.places.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trip.places.map((place) => {
                const p = typeof place === 'object' ? place : { _id: place, name: place };
                const location = [p.city, p.country].filter(Boolean).join(', ');
                return (
                  <div
                    key={p._id}
                    className={styles.memberRow}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text weight="semibold">{p.name}</Text>
                        {p.custom && (
                          <Badge appearance="outline" color="warning">Custom</Badge>
                        )}
                        {p.type && (
                          <Badge appearance="outline" style={{ textTransform: 'capitalize' }}>{p.type}</Badge>
                        )}
                      </div>
                      {location && (
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{location}</Text>
                      )}
                      {p.fee && p.fee !== 'Free' && (
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Fee: {p.fee}</Text>
                      )}
                      {p.notes && p.custom && (
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{p.notes}</Text>
                      )}
                      {p.googleMapUrl && (
                        <a href={p.googleMapUrl} target="_blank" rel="noopener noreferrer">
                          <Button icon={<Location24Regular />} size="small" appearance="subtle">Map</Button>
                        </a>
                      )}
                    </div>
                    {canEdit && (
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Dismiss24Regular />}
                        onClick={() => handleRemoveTripPlace(p._id)}
                        title="Remove from trip"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ Notes Tab ═══════════ */}
      {activeTab === 'notes' && (
        <div className={styles.section}>
          <Field label="Trip Notes">
            <Textarea
              value={editingNotes}
              onChange={(e, data) => setEditingNotes(data.value)}
              rows={12}
              disabled={!canEdit}
              placeholder="Add general notes about the trip..."
              style={{ width: '100%' }}
            />
          </Field>
          {canEdit && (
            <Button
              appearance="primary"
              icon={<Save24Regular />}
              onClick={handleSaveNotes}
              style={{ marginTop: 12 }}
              disabled={saving}
            >
              Save Notes
            </Button>
          )}
        </div>
      )}

      {/* ═══════════ Documents Tab ═══════════ */}
      {activeTab === 'documents' && (
        <div className={styles.section}>
          {canEdit && (
            <Dialog open={docDialogOpen} onOpenChange={(e, data) => setDocDialogOpen(data.open)}>
              <DialogTrigger disableButtonEnhancement>
                <Button icon={<Add24Regular />} appearance="primary" style={{ marginBottom: 16 }}>
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogSurface>
                <DialogBody>
                  <DialogTitle>Add Document Link</DialogTitle>
                  <DialogContent>
                    <div className={styles.form}>
                      <Field label="Title" required>
                        <Input
                          value={newDoc.title}
                          onChange={(e, data) => setNewDoc((p) => ({ ...p, title: data.value }))}
                          placeholder="e.g. Flight Booking"
                        />
                      </Field>
                      <Field label="URL" required>
                        <Input
                          value={newDoc.url}
                          onChange={(e, data) => setNewDoc((p) => ({ ...p, url: data.value }))}
                          placeholder="https://..."
                        />
                      </Field>
                      <Field label="Type">
                        <Dropdown
                          value={newDoc.type}
                          onOptionSelect={(e, data) => setNewDoc((p) => ({ ...p, type: data.optionValue }))}
                        >
                          {['flight', 'hotel', 'visa', 'insurance', 'ticket', 'other'].map((t) => (
                            <Option key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Option>
                          ))}
                        </Dropdown>
                      </Field>
                      <Field label="Notes">
                        <Input
                          value={newDoc.notes}
                          onChange={(e, data) => setNewDoc((p) => ({ ...p, notes: data.value }))}
                          placeholder="Any notes"
                        />
                      </Field>
                    </div>
                  </DialogContent>
                  <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="secondary">Cancel</Button>
                    </DialogTrigger>
                    <Button appearance="primary" onClick={handleAddDoc} disabled={!newDoc.title || !newDoc.url}>
                      Add
                    </Button>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
          )}

          {(!trip.documents || trip.documents.length === 0) ? (
            <Text>No documents attached yet.</Text>
          ) : (
            trip.documents.map((doc, i) => (
              <Card key={i} className={styles.docCard}>
                <div>
                  <Document24Regular style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Text weight="semibold">{doc.title}</Text>
                  </a>
                  <Badge appearance="tint" style={{ marginLeft: 8, textTransform: 'capitalize' }}>
                    {doc.type}
                  </Badge>
                  {doc.notes && (
                    <Text size={200} block style={{ marginTop: 4, color: tokens.colorNeutralForeground3 }}>
                      {doc.notes}
                    </Text>
                  )}
                </div>
                {canEdit && (
                  <Button
                    icon={<Delete24Regular />}
                    size="small"
                    appearance="subtle"
                    onClick={() => handleDeleteDoc(i)}
                  />
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* ═══════════ Members Tab ═══════════ */}
      {activeTab === 'members' && (
        <div className={styles.section}>
          {isOwner && (
            <Dialog open={memberDialogOpen} onOpenChange={(e, data) => setMemberDialogOpen(data.open)}>
              <DialogTrigger disableButtonEnhancement>
                <Button icon={<People24Regular />} appearance="primary" style={{ marginBottom: 16 }}>
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogSurface>
                <DialogBody>
                  <DialogTitle>Add Trip Member</DialogTitle>
                  <DialogContent>
                    <Field label="Search by name or email">
                      <Input
                        value={memberSearch}
                        onChange={(e, data) => handleSearchMembers(data.value)}
                        placeholder="Type at least 2 characters..."
                      />
                    </Field>
                    <div style={{ marginTop: 12, maxHeight: 200, overflow: 'auto' }}>
                      {memberResults.map((u) => (
                        <div key={u._id} className={styles.memberRow}>
                          <Text>{u.name} ({u.email || u.phone})</Text>
                          <Button size="small" appearance="primary" onClick={() => handleAddMember(u._id)}>
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                  <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="secondary">Close</Button>
                    </DialogTrigger>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
          )}

          <Card style={{ padding: 16 }}>
            <Text weight="semibold" block style={{ marginBottom: 12 }}>
              Trip Members
            </Text>
            {/* Owner */}
            <div className={styles.memberRow}>
              <Text>{trip.owner?.name} ({trip.owner?.email})</Text>
              <Badge appearance="tint" color="success">Owner</Badge>
            </div>
            {/* Members */}
            {trip.members?.map((m) => (
              <div key={m.user?._id} className={styles.memberRow}>
                <Text>{m.user?.name} ({m.user?.email})</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge appearance="tint" style={{ textTransform: 'capitalize' }}>{m.role}</Badge>
                  {isOwner && (
                    <Button
                      icon={<Delete24Regular />}
                      size="small"
                      appearance="subtle"
                      onClick={() => handleRemoveMember(m.user?._id)}
                    />
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ═══════════ Edit Trip Dialog ═══════════ */}
      <Dialog open={editTripOpen} onOpenChange={(e, data) => setEditTripOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Edit Trip Details</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <Field label="Title" required>
                  <Input
                    value={editTripForm.title || ''}
                    onChange={(e, data) => setEditTripForm((p) => ({ ...p, title: data.value }))}
                  />
                </Field>
                <Field label="Destination">
                  <Input
                    value={editTripForm.destination || ''}
                    onChange={(e, data) => setEditTripForm((p) => ({ ...p, destination: data.value }))}
                    placeholder="e.g. Bangkok, Thailand"
                  />
                </Field>
                <Field label="Description">
                  <Textarea
                    value={editTripForm.description || ''}
                    onChange={(e, data) => setEditTripForm((p) => ({ ...p, description: data.value }))}
                    placeholder="Brief description of the trip"
                  />
                </Field>
                <Field label="Start Date">
                  <Input
                    type="date"
                    value={editTripForm.startDate || ''}
                    onChange={(e, data) => setEditTripForm((p) => ({ ...p, startDate: data.value }))}
                  />
                </Field>
                <Field label="End Date">
                  <Input
                    type="date"
                    value={editTripForm.endDate || ''}
                    onChange={(e, data) => setEditTripForm((p) => ({ ...p, endDate: data.value }))}
                  />
                </Field>
                <Field label="Status">
                  <Dropdown
                    value={editTripForm.status || 'planning'}
                    onOptionSelect={(e, data) =>
                      setEditTripForm((p) => ({ ...p, status: data.optionValue }))
                    }
                  >
                    {['planning', 'confirmed', 'in-progress', 'completed', 'cancelled'].map((s) => (
                      <Option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
              </div>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                onClick={handleSaveTripDetails}
                disabled={!editTripForm.title}
              >
                Save
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
