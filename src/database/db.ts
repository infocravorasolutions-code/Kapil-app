import SQLite from 'react-native-sqlite-2';

interface InvoiceData {
  customer_name: string;
  customer_id: string;
  jewellery_details: string;
  gross_weight: number;
  net_weight: number;
  gold_purity: string;
  customer_signature: string;
  customer_image: string;
  pdf_path: string;
}

class Database {
  private db: any = null;

  async initDatabase(): Promise<void> {
    try {
      this.db = SQLite.openDatabase('invoices.db', '1.0', 'Invoices Database', 200000);
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        // First, create the table if it doesn't exist
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            jewellery_details TEXT NOT NULL,
            gross_weight REAL NOT NULL,
            net_weight REAL NOT NULL,
            gold_purity TEXT NOT NULL,
            pdf_path TEXT NOT NULL,
            created_at TEXT NOT NULL
          );`,
          [],
          () => {
            console.log('Base table created successfully');
            // Now check if we need to add new columns
            this.addNewColumns(tx, resolve, reject);
          },
          (error: any) => {
            console.error('Error creating base table:', error);
            reject(error);
          }
        );
      });
    });
  }

  private addNewColumns(tx: any, resolve: () => void, reject: (error: any) => void): void {
    // Check if customer_id column exists, if not add it
    tx.executeSql(
      `PRAGMA table_info(invoices)`,
      [],
      (tx: any, results: any) => {
        const columns: string[] = [];
        for (let i = 0; i < results.rows.length; i++) {
          columns.push(results.rows.item(i).name);
        }
        
        // Add customer_id column if it doesn't exist
        if (!columns.includes('customer_id')) {
          tx.executeSql(
            `ALTER TABLE invoices ADD COLUMN customer_id TEXT NOT NULL DEFAULT ''`,
            [],
            () => {
              console.log('Added customer_id column');
              this.addRemainingColumns(tx, columns, resolve, reject);
            },
            (error: any) => {
              console.error('Error adding customer_id column:', error);
              reject(error);
            }
          );
        } else {
          this.addRemainingColumns(tx, columns, resolve, reject);
        }
      },
      (error: any) => {
        console.error('Error checking table info:', error);
        reject(error);
      }
    );
  }

  private addRemainingColumns(tx: any, columns: string[], resolve: () => void, reject: (error: any) => void): void {
    const addNextColumn = (columnName: string, sql: string, callback: () => void) => {
      if (!columns.includes(columnName)) {
        tx.executeSql(
          sql,
          [],
          () => {
            console.log(`Added ${columnName} column`);
            callback();
          },
          (error: any) => {
            console.error(`Error adding ${columnName} column:`, error);
            reject(error);
          }
        );
      } else {
        callback();
      }
    };

    // Add customer_signature column
    addNextColumn('customer_signature', 'ALTER TABLE invoices ADD COLUMN customer_signature TEXT', () => {
      // Add customer_image column
      addNextColumn('customer_image', 'ALTER TABLE invoices ADD COLUMN customer_image TEXT', () => {
        resolve();
      });
    });
  }

  async insertInvoice(data: InvoiceData): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve) => {
      this.db.transaction((tx: any) => {
        const timestamp = new Date().toISOString();
        
        // First, check if the new columns exist
        tx.executeSql(
          `PRAGMA table_info(invoices)`,
          [],
          (tx: any, results: any) => {
            const columns: string[] = [];
            for (let i = 0; i < results.rows.length; i++) {
              columns.push(results.rows.item(i).name);
            }
            
            const hasCustomerId = columns.includes('customer_id');
            const hasCustomerSignature = columns.includes('customer_signature');
            const hasCustomerImage = columns.includes('customer_image');
            
            let sql, params;
            
            if (hasCustomerId && hasCustomerSignature && hasCustomerImage) {
              // New schema with all columns
              sql = `INSERT INTO invoices (
                customer_name, 
                customer_id,
                jewellery_details, 
                gross_weight, 
                net_weight, 
                gold_purity, 
                customer_signature,
                customer_image,
                pdf_path, 
                created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
              params = [
                data.customer_name,
                data.customer_id || '',
                data.jewellery_details,
                data.gross_weight,
                data.net_weight,
                data.gold_purity,
                data.customer_signature || null,
                data.customer_image || null,
                data.pdf_path,
                timestamp,
              ];
            } else if (hasCustomerId && hasCustomerSignature) {
              // Schema with customer_id and customer_signature
              sql = `INSERT INTO invoices (
                customer_name, 
                customer_id,
                jewellery_details, 
                gross_weight, 
                net_weight, 
                gold_purity, 
                customer_signature,
                pdf_path, 
                created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
              params = [
                data.customer_name,
                data.customer_id || '',
                data.jewellery_details,
                data.gross_weight,
                data.net_weight,
                data.gold_purity,
                data.customer_signature || null,
                data.pdf_path,
                timestamp,
              ];
            } else {
              // Old schema without new columns
              sql = `INSERT INTO invoices (
                customer_name, 
                jewellery_details, 
                gross_weight, 
                net_weight, 
                gold_purity, 
                pdf_path, 
                created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
              params = [
                data.customer_name,
                data.jewellery_details,
                data.gross_weight,
                data.net_weight,
                data.gold_purity,
                data.pdf_path,
                timestamp,
              ];
            }
            
            tx.executeSql(
              sql,
              params,
              () => {
                console.log('Invoice saved successfully');
                resolve(true);
              },
              (error: any) => {
                console.error('Error saving invoice:', error);
                resolve(false);
              }
            );
          },
          (error: any) => {
            console.error('Error checking table schema:', error);
            resolve(false);
          }
        );
      });
    });
  }

  async getAllInvoices(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          'SELECT * FROM invoices ORDER BY created_at DESC',
          [],
          (tx: any, results: any) => {
            const invoices = [];
            for (let i = 0; i < results.rows.length; i++) {
              invoices.push(results.rows.item(i));
            }
            resolve(invoices);
          },
          (error: any) => {
            console.error('Error fetching invoices:', error);
            resolve([]);
          }
        );
      });
    });
  }

  async getInvoiceById(id: number): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          'SELECT * FROM invoices WHERE id = ?',
          [id],
          (tx: any, results: any) => {
            if (results.rows.length > 0) {
              resolve(results.rows.item(0));
            } else {
              resolve(null);
            }
          },
          (error: any) => {
            console.error('Error fetching invoice by ID:', error);
            resolve(null);
          }
        );
      });
    });
  }

  async deleteInvoice(id: number): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          'DELETE FROM invoices WHERE id = ?',
          [id],
          () => {
            console.log('Invoice deleted successfully');
            resolve(true);
          },
          (error: any) => {
            console.error('Error deleting invoice:', error);
            resolve(false);
          }
        );
      });
    });
  }

  async closeDatabase(): Promise<void> {
    // react-native-sqlite-2 doesn't require explicit closing
    this.db = null;
  }
}

export const database = new Database();
export type { InvoiceData };
