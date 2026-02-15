
import { Lane } from './types';

export const FORENSIC_LANES: Lane[] = [
  // ============================================================================
  // GROUP A: CORE ASSETS
  // ============================================================================
  {
    id: '01',
    name: 'Property & Real Estate',
    group: 'Core Assets',
    paths: [
      {
        id: 'deeds',
        name: 'Deeds',
        description: 'Ownership deeds for 320-acre properties',
        extraction_schema: {
          target_data_elements: {
            document_type: { type: "string" },
            recording_info: { type: "object", items: { liber: { type: "string" }, record_date: { type: "date" } } },
            parties: { type: "object", items: { grantor: { type: "string" }, grantee: { type: "string" } } },
            property_identifiers: { type: "object", items: { parcel_id: { type: "string" }, legal_desc: { type: "string" } } },
            consideration_amount: { type: "currency", description: "Was it sold for $1?" },
            transfer_tax: { type: "currency", description: "Implies true value" }
          }
        }
      },
      {
        id: 'tax_assessments',
        name: 'Property Tax',
        description: 'Tax bills for woodlands',
        extraction_schema: {
          target_data_elements: {
            tax_year: { type: "string" },
            taxable_value: { type: "currency" },
            state_equalized_value: { type: "currency" },
            millage_rate: { type: "number" },
            total_tax_due: { type: "currency" }
          }
        }
      }
    ]
  },
  // ============================================================================
  // GROUP C: LAND & CONSERVANCY (The "Hobby" Farm)
  // ============================================================================
  {
    id: '09',
    name: 'Timber & Resources',
    group: 'Land & Conservancy',
    paths: [
      {
        id: 'timber_contracts',
        name: 'Timber Harvesting Contracts',
        description: 'Stumpage, thinning, and logging agreements',
        extraction_schema: {
          target_data_elements: {
            logger_name: { type: "string" },
            contract_date: { type: "date" },
            species_harvested: { type: "string" },
            volume_mbf: { type: "number" },
            stumpage_rate: { type: "currency" },
            total_payment: { type: "currency" },
            payment_dest_account: { type: "string", description: "Did this go to Joint or Separate?" }
          }
        }
      },
      {
        id: 'mineral_rights',
        name: 'Mineral/Oil/Gas Leases',
        description: 'Subsurface rights revenue',
        extraction_schema: {
          target_data_elements: {
            lessee: { type: "string" },
            lease_term: { type: "string" },
            royalty_percent: { type: "percentage" },
            signing_bonus: { type: "currency" },
            monthly_royalties: { type: "currency" }
          }
        }
      }
    ]
  },
  {
    id: '10',
    name: 'Government Programs',
    group: 'Land & Conservancy',
    paths: [
      {
        id: 'usda_contracts',
        name: 'USDA/NRCS Contracts',
        description: 'CRP, EQIP, WHIP programs',
        extraction_schema: {
          target_data_elements: {
            program_name: { type: "string" },
            contract_number: { type: "string" },
            practice_code: { type: "string" },
            cost_share_amount: { type: "currency" },
            obligated_completion_date: { type: "date" }
          }
        }
      },
      {
        id: 'dnr_permits',
        name: 'DNR Management Plans',
        description: 'Forest stewardship and wildlife mgmt',
        extraction_schema: {
          target_data_elements: {
            plan_type: { type: "string" },
            enrolled_acres: { type: "number" },
            tax_abatement: { type: "boolean" },
            mandatory_actions: { type: "array" }
          }
        }
      }
    ]
  },
  {
    id: '11',
    name: 'Land Improvements (Hobby Spend)',
    group: 'Land & Conservancy',
    paths: [
      {
        id: 'heavy_equipment',
        name: 'Heavy Equipment',
        description: 'Tractors, Skidders, Dozers',
        extraction_schema: {
          target_data_elements: {
            equipment_type: { type: "string" },
            purchase_price: { type: "currency" },
            funding_source: { type: "string" },
            business_justification: { type: "string" },
            usage_evidence: { type: "string" }
          }
        }
      },
      {
        id: 'conservation_inputs',
        name: 'Conservation Inputs',
        description: 'Seed, Fertilizer, Lime for food plots',
        extraction_schema: {
          target_data_elements: {
            product_type: { type: "string" },
            quantity: { type: "number" },
            cost: { type: "currency" },
            location_applied: { type: "string" }
          }
        }
      }
    ]
  },
  // ============================================================================
  // GROUP D: LIFESTYLE LEAKAGE (Grocery Store Funding)
  // ============================================================================
  {
    id: '13',
    name: 'Subsidy & Third-Party',
    group: 'Lifestyle',
    paths: [
      {
        id: 'gifts',
        name: 'Non-Obligatory Gifts',
        description: 'Discretionary giving',
        extraction_schema: {
          target_data_elements: {
            recipient: { type: "string" },
            date: { type: "date" },
            value: { type: "currency" }
          }
        }
      }
    ]
  },
  {
    id: '17',
    name: 'Sporting & Recreation',
    group: 'Lifestyle',
    paths: [
      {
        id: 'ammo',
        name: 'Ammunition & Gear',
        description: 'Consumable supplies',
        extraction_schema: {
          target_data_elements: {
            retailer: { type: "string" },
            caliber: { type: "string" },
            price: { type: "currency" }
          }
        }
      }
    ]
  }
];
