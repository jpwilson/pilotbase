// ============================================================
// FSP API Type Definitions
// Based on the API Appendix
// ============================================================

// --- Auth ---
export interface FSPCredentials {
  email: string;
  password: string;
}

export interface FSPSession {
  token: string;
  user: {
    email: string;
  };
}

// --- Operators & Users ---
export interface FSPOperator {
  id: number;
  name: string;
  isActive: boolean;
  isPending: boolean;
}

export interface FSPUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  imageUrl?: string;
}

// --- Locations ---
export interface FSPLocation {
  id: string;
  name: string;
  code: string; // ICAO
  timeZone: string;
  isActive: boolean;
}

// --- Aircraft ---
export interface FSPAircraft {
  id: string;
  registration: string;
  make: string;
  model: string;
  makeModel: string;
  isActive: boolean;
  isSimulator: boolean;
}

// --- Instructors ---
export interface FSPInstructor {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  instructorType: string;
  isActive: boolean;
}

// --- Activity Types ---
export interface FSPActivityType {
  id: string;
  name: string;
  displayType: ActivityDisplayType;
  isActive: boolean;
}

export enum ActivityDisplayType {
  RentalInstruction = 0,
  Maintenance = 1,
  Class = 2,
  Meeting = 3,
}

// --- Scheduling Groups ---
export interface FSPSchedulingGroup {
  id: string;
  name?: string;
  aircraftIds?: string[];
}

// --- Availability ---
export interface FSPAvailability {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startAtTimeUtc: string;
  endAtTimeUtc: string;
}

export interface FSPAvailabilityOverride {
  date: string;
  startTime: string;
  endTime: string;
  isUnavailable: boolean;
}

export interface FSPUserAvailability {
  userGuidId: string;
  availabilities: FSPAvailability[];
  availabilityOverrides: FSPAvailabilityOverride[];
}

// --- Schedule ---
export interface FSPScheduleRequest {
  start: string;
  end: string;
  locationIds: number[];
  aircraftIds?: string[];
  instructorIds?: string[];
  outputFormat: "bryntum";
  pageSize?: number;
}

export interface FSPScheduleEvent {
  Start: string;
  End: string;
  Title: string;
  CustomerName: string;
  InstructorName: string;
  AircraftName: string;
  // Additional fields from the actual API
  ReservationId?: string;
  PilotId?: string;
  InstructorId?: string;
  AircraftId?: string;
  LocationId?: string;
  Status?: number;
}

export interface FSPUnavailability {
  ResourceId: string;
  StartDate: string;
  EndDate: string;
  Name: string;
}

export interface FSPScheduleResponse {
  results: {
    events: FSPScheduleEvent[];
    resources: unknown[];
    unavailability: FSPUnavailability[];
  };
}

// --- Schedulable Events (Training Queue) ---
export interface FSPSchedulableEvent {
  eventId: string;
  enrollmentId: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  courseId: string;
  courseName: string;
  lessonId: string;
  lessonName: string;
  lessonOrder: number;
  flightType: FlightType;
  routeType: RouteType;
  timeOfDay: TimeOfDay;
  durationTotal: number;
  aircraftDurationTotal: number;
  instructorDurationPre: number;
  instructorDurationPost: number;
  instructorDurationTotal: number;
  instructorRequired: boolean;
  instructorIds: string[];
  aircraftIds: string[];
  schedulingGroupIds: string[];
  meetingRoomIds: string[];
  isStageCheck: boolean;
  reservationTypeId: string;
  activityTypeId: string;
}

export enum FlightType {
  Dual = 0,
  Solo = 1,
}

export enum RouteType {
  Local = 0,
  CrossCountry = 1,
}

export enum TimeOfDay {
  Anytime = 0,
  Day = 1,
  Night = 2,
}

// --- AutoSchedule ---
export interface FSPAutoScheduleConfig {
  aircraftTargetUtilizationPercent: number;
  constraintsByDay: FSPDayConstraint[];
  intervalLengthInMinutes: number;
  requestRange: { startDate: string; endDate: string };
  reservationGapInMinutes: number;
  reservationStaggerGroups: number;
  schedulingWindowStart: string;
  schedulingWindowEnd: string;
  staggerDurationInMinutes: number;
}

export interface FSPDayConstraint {
  forDate: string;
  timeZoneOffset: number;
  civilTwilightDay: { startDate: string; endDate: string };
  operatingHours: { startDate: string; endDate: string };
}

export interface FSPAutoScheduleRequest {
  config: FSPAutoScheduleConfig;
  aircraft: FSPAutoScheduleAircraft[];
  customers: FSPAutoScheduleCustomer[];
  events: FSPAutoScheduleEvent[];
  instructors: FSPAutoScheduleInstructor[];
  meetingRooms: unknown[];
  resourceAvailability: FSPResourceAvailability[];
  schedulingGroupAircraft: FSPSchedulingGroupAircraft[];
}

export interface FSPAutoScheduleAircraft {
  order: number;
  aircraftId: string;
  scheduling: { timeBeforeMaintenance: number; preFlightTime: number; postFlightTime: number };
}

export interface FSPAutoScheduleCustomer {
  order: number;
  userId: string;
  resourceId: string;
  scheduling: { maximumConcurrentFlightTime: number };
}

export interface FSPAutoScheduleEvent {
  activityTypeLayout: number;
  aircraftDuration: number;
  aircraftIds: string[];
  courseId: string;
  customer1Guid: string;
  customer2Guid: string;
  eventId: string;
  flightTimeEstimate: number;
  flightType: string;
  instructorDurationFlight: number;
  instructorDurationPost: number;
  instructorDurationPre: number;
  instructorDurationTotal: number;
  instructorIds: string[];
  instructorRequired: boolean;
  isCheck: boolean;
  lessonId: string;
  lessonNumber: number;
  lessonType: string;
  locationId: number;
  meetingRoomIds: string[];
  order: number;
  routeType: string;
  schedulingGroupIds: string[];
  studentId: string;
  time: string;
  totalLength: number;
}

export interface FSPAutoScheduleInstructor {
  order: number;
  userId: string;
  resourceId: string;
  instructorId: string;
  name: string;
  scheduling: { maximumConcurrentFlightTime: number };
}

export interface FSPResourceAvailability {
  resourceId: string;
  resourceType: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  name?: string;
}

export interface FSPSchedulingGroupAircraft {
  schedulingGroupId: string;
  aircraftIds: string[];
  reserveAircraft: number;
  slots: number;
}

export interface FSPAutoScheduleResult {
  events: FSPAutoScheduleResultEvent[];
}

export interface FSPAutoScheduleResultEvent {
  eventId: string;
  customerId: string;
  instructorId: string;
  aircraftId: string;
  success: boolean;
  startTime: string;
  endTime: string;
  error: string | null;
}

// --- AutoSchedule Settings ---
export interface FSPAutoScheduleSettings {
  minutesBetweenEvents: number;
  percentageUtilized: number;
  reservationStaggerGroups: number;
  schedulingWindowStart: string;
  schedulingWindowEnd: string;
  staggerOffsetTime: number;
  useAllInstructors: boolean;
}

// --- Reservations ---
export interface FSPReservationRequest {
  aircraftId: string;
  application: number;
  client: string;
  comments: string;
  end: string;
  equipmentIds: string[];
  estimatedFlightHours: string;
  flightRoute: string;
  flightRules: number;
  flightType: number;
  instructorId: string;
  instructorPostFlightMinutes: number;
  instructorPreFlightMinutes: number;
  internalComments: string;
  locationId: number;
  operatorId: number;
  overrideExceptions: boolean;
  pilotId: string;
  recurring: boolean;
  reservationTypeId: string;
  schedulingGroupId: string | null;
  schedulingGroupSlotId: string | null;
  sendEmailNotification: boolean;
  start: string;
  trainingSessions: FSPTrainingSession[];
  validateOnly: boolean;
}

export interface FSPTrainingSession {
  courseId: string;
  lessonId: string;
  enrollmentId: string;
  studentId: string;
}

export interface FSPReservationResponse {
  id?: string;
  errors?: Array<{ message: string; field: string }>;
}

export interface FSPReservationListRequest {
  dateRangeType: number;
  startRange: string;
  endRange: string;
  locationIds: number[];
  pageSize: number;
  pageIndex: number;
}

export interface FSPReservationListItem {
  reservationId: string;
  reservationNumber: number;
  resource: string;
  start: string;
  end: string;
  pilotFirstName: string;
  pilotLastName: string;
  pilotId: string;
  status: number;
}

// --- Enrollment & Training ---
export interface FSPEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  courseName: string;
  status: string;
}

export interface FSPEnrollmentProgress {
  enrollmentId: string;
  completedLessons: number;
  totalLessons: number;
  completionPercentage: number;
}

// --- Weather ---
export interface FSPMetar {
  raw: string;
  stationId: string;
  // Full METAR fields available from API
}

export interface FSPTaf {
  raw: string;
  stationId: string;
}

// --- Civil Twilight ---
export interface FSPCivilTwilight {
  startDate: string;
  endDate: string;
}

// --- Cancellation Reasons ---
export interface FSPCancellationReason {
  id: string;
  name: string;
}
