
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "budgets": {
                  Row: {
                    "amount": number,"category_id": string,"id": string,"list_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"category_id": string,"id"?: string,"list_id": string
                  }
                  Update: {
                    "amount"?: number,"category_id"?: string,"id"?: string,"list_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "budgets_category_same_list_fkey"
      columns: ["list_id","category_id"]
isOneToOne: true
      referencedRelation: "categories"
      referencedColumns: ["list_id","id"]
    },{
      foreignKeyName: "budgets_list_id_fkey"
      columns: ["list_id"]
isOneToOne: false
      referencedRelation: "lists"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "color": string,"created_at": string,"emoji": string,"id": string,"keywords": (string)[],"kind": Database["public"]['Enums']["category_kind"],"list_id": string,"name": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"created_at"?: string,"emoji": string,"id"?: string,"keywords"?: (string)[],"kind"?: Database["public"]['Enums']["category_kind"],"list_id": string,"name": string,"sort_order"?: number
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"emoji"?: string,"id"?: string,"keywords"?: (string)[],"kind"?: Database["public"]['Enums']["category_kind"],"list_id"?: string,"name"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_list_id_fkey"
      columns: ["list_id"]
isOneToOne: false
      referencedRelation: "lists"
      referencedColumns: ["id"]
    }
                  ]
                },"list_members": {
                  Row: {
                    "joined_at": string,"list_id": string,"role": Database["public"]['Enums']["list_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "joined_at"?: string,"list_id": string,"role"?: Database["public"]['Enums']["list_role"],"user_id": string
                  }
                  Update: {
                    "joined_at"?: string,"list_id"?: string,"role"?: Database["public"]['Enums']["list_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "list_members_list_id_fkey"
      columns: ["list_id"]
isOneToOne: false
      referencedRelation: "lists"
      referencedColumns: ["id"]
    }
                  ]
                },"lists": {
                  Row: {
                    "created_at": string,"currency": string,"emoji": string,"id": string,"name": string,"owner_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"currency"?: string,"emoji"?: string,"id"?: string,"name": string,"owner_id": string
                  }
                  Update: {
                    "created_at"?: string,"currency"?: string,"emoji"?: string,"id"?: string,"name"?: string,"owner_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"default_currency": string,"display_name": string | null,"id": string,"locale": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"default_currency"?: string,"display_name"?: string | null,"id": string,"locale"?: string
                  }
                  Update: {
                    "created_at"?: string,"default_currency"?: string,"display_name"?: string | null,"id"?: string,"locale"?: string
                  }
                  Relationships: [
                    
                  ]
                },"transactions": {
                  Row: {
                    "amount": number,"category_id": string | null,"created_at": string,"created_by": string,"currency": string,"id": string,"list_id": string,"note": string,"occurred_on": string,"source": Database["public"]['Enums']["transaction_source"]
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"category_id"?: string | null,"created_at"?: string,"created_by"?: string,"currency": string,"id"?: string,"list_id": string,"note"?: string,"occurred_on"?: string,"source"?: Database["public"]['Enums']["transaction_source"]
                  }
                  Update: {
                    "amount"?: number,"category_id"?: string | null,"created_at"?: string,"created_by"?: string,"currency"?: string,"id"?: string,"list_id"?: string,"note"?: string,"occurred_on"?: string,"source"?: Database["public"]['Enums']["transaction_source"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "transactions_category_same_list_fkey"
      columns: ["list_id","category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["list_id","id"]
    },{
      foreignKeyName: "transactions_list_id_fkey"
      columns: ["list_id"]
isOneToOne: false
      referencedRelation: "lists"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "is_list_member":
{ Args: { "p_list_id": string }; Returns: boolean
                           },
"is_list_owner":
{ Args: { "p_list_id": string }; Returns: boolean
                           }
          }
          Enums: {
            "category_kind": "expense"|"income","list_role": "owner"|"editor","transaction_source": "manual"|"text"|"voice"|"ai"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "category_kind": ["expense", "income"],"list_role": ["owner", "editor"],"transaction_source": ["manual", "text", "voice", "ai"]
          }
        }
} as const
