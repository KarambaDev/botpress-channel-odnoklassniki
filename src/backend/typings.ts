import { OdnoklassnikiClient } from './client'

export type Clients = { [key: string]: OdnoklassnikiClient }
export type Responds = { message: string, error: Boolean }