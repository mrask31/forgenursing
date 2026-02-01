// Database types for Supabase tables
export interface Database {
  public: {
    Tables: {
      webhook_events: {
        Row: {
          id: string
          stripe_event_id: string
          event_type: string
          payload: any
          status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'retrying'
          attempt_count: number
          last_attempt_at: string | null
          last_error: string | null
          succeeded_at: string | null
          created_at: string
          updated_at: string
          user_id: string | null
          customer_id: string | null
          subscription_id: string | null
        }
        Insert: {
          id?: string
          stripe_event_id: string
          event_type: string
          payload: any
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'retrying'
          attempt_count?: number
          last_attempt_at?: string | null
          last_error?: string | null
          succeeded_at?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
          customer_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          id?: string
          stripe_event_id?: string
          event_type?: string
          payload?: any
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'retrying'
          attempt_count?: number
          last_attempt_at?: string | null
          last_error?: string | null
          succeeded_at?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
          customer_id?: string | null
          subscription_id?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          subscription_status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          subscription_status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subscription_status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_webhooks_for_retry: {
        Args: {
          max_attempts?: number
          retry_delay_minutes?: number
        }
        Returns: Array<{
          id: string
          stripe_event_id: string
          event_type: string
          payload: any
          attempt_count: number
          last_error: string | null
        }>
      }
      get_webhook_stats: {
        Args: {}
        Returns: Array<{
          total_events: number
          succeeded: number
          failed: number
          pending: number
          retrying: number
          avg_attempts: number
          last_24h_events: number
          last_24h_failures: number
        }>
      }
    }
  }
}
