export interface Waypoint {
  name: string
  lat: number
  lng: number
}

export interface Announcement {
  _id: string
  role: "driver" | "passenger"
  from: string
  to: string
  aiText: string
  telegramUsername?: string
  authorName?: string
  authorId?: string
  channelMessageId?: number
  channelUsername?: string
  createdAt?: string
  isActive?: boolean
  isRoundTrip?: boolean
  fromLat?: number
  fromLng?: number
  toLat?: number
  toLng?: number
  waypoints?: Waypoint[]
  tripType?: "once" | "regular"
  departureDate?: string
  schedule?: string[]
  departureTime?: string
  returnTime?: string
  returnDate?: string
  phone?: string
  community?: string
  seats?: number
  tripScope?: "suburban" | "intercity"
  _matchedAsReturn?: boolean
  archivedAt?: string
  archiveReason?: string
  views?: number
}
