export interface Room {
  id: number;
  name: string;
  description: string;
  price_per_night: number;
  capacity: number;
  image?: string;
  is_available: boolean;
}

export interface RoomTypeAvailability {
  room_type: string;
  available_count: number;
  price_per_night: number;
  capacity: number;
}