import bcryptjs from 'bcryptjs';
import { supabase } from '../config/database.js';

class User {
  // Create a new user
  static async create(userData) {
    try {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(userData.password, salt);

      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email: userData.email,
            password: hashedPassword,
            name: userData.name || userData.email.split('@')[0],
            role: userData.role || 'USER',
            is_first_login: userData.isFirstLogin !== undefined ? userData.isFirstLogin : true,
            is_active: userData.isActive !== undefined ? userData.isActive : true
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return this._formatUser(data);
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findOne(filter, includePassword = false) {
    try {
      let query = supabase.from('users').select('*');

      if (filter.email) {
        query = query.eq('email', filter.email);
      } else if (filter.id) {
        query = query.eq('id', filter.id);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this._formatUser(data);
    } catch (error) {
      throw error;
    }
  }

  // Delete many users (for seeding)
  static async deleteMany(filter = {}) {
    try {
      let query = supabase.from('users').delete();

      if (Object.keys(filter).length === 0) {
        // Delete all - need to get all first then delete each
        const { data: allUsers, error: selectError } = await supabase
          .from('users')
          .select('id');

        if (selectError) throw selectError;

        if (allUsers.length > 0) {
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

          if (deleteError) throw deleteError;
        }
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async updateOne(filter, updateData) {
    try {
      let query = supabase.from('users').update({
        password: updateData.password ? await bcryptjs.hash(updateData.password, await bcryptjs.genSalt(10)) : undefined,
        is_first_login: updateData.isFirstLogin,
        name: updateData.name,
        is_active: updateData.isActive
      });

      if (filter.id) {
        query = query.eq('id', filter.id);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;
      return this._formatUser(data);
    } catch (error) {
      throw error;
    }
  }

  // Compare password method
  static async comparePassword(storedPassword, enteredPassword) {
    return await bcryptjs.compare(enteredPassword, storedPassword);
  }

  // Format user data for response
  static _formatUser(data) {
    if (!data) return null;
    return {
      id: data.id,
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role,
      isFirstLogin: data.is_first_login,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      getPublicProfile: function() {
        return {
          id: this.id,
          email: this.email,
          name: this.name,
          role: this.role,
          isFirstLogin: this.isFirstLogin
        };
      }
    };
  }
}

export default User;

