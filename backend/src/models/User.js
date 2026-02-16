import bcryptjs from 'bcryptjs';
import { supabase } from '../config/database.js';

class User {
  // Create a new user
  static async create(userData) {
    try {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(userData.password, salt);

      // Build insert object with only provided fields
      const insertData = {
        password: hashedPassword,
        full_name: userData.fullName || userData.username || 'User',
        role: userData.role || 'USER',
        is_first_login: userData.isFirstLogin !== undefined ? userData.isFirstLogin : true,
        is_active: userData.isActive !== undefined ? userData.isActive : true
      };

      // Add optional fields if provided
      if (userData.studentNumber) insertData.student_number = userData.studentNumber;
      if (userData.username) insertData.username = userData.username;
      if (userData.instituteEmail) insertData.institute_email = userData.instituteEmail;
      if (userData.personalEmail) insertData.personal_email = userData.personalEmail;
      if (userData.birthday) insertData.birthday = userData.birthday;
      if (userData.signature) insertData.signature = userData.signature;

      const { data, error } = await supabase
        .from('users')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return this._formatUser(data);
    } catch (error) {
      throw error;
    }
  }

  // Find user by email or student number
  static async findOne(filter, includePassword = false) {
    try {
      let query = supabase.from('users').select('*');

      if (filter.email) {
        query = query.eq('email', filter.email);
      } else if (filter.studentNumber) {
        query = query.eq('student_number', filter.studentNumber);
      } else if (filter.id) {
        query = query.eq('id', filter.id);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }

      return this._formatUser(data);
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
        .eq('id', String(id))
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
      password: data.password,
      fullName: data.full_name,
      role: data.role,
      studentNumber: data.student_number,
      username: data.username,
      birthday: data.birthday,
      instituteEmail: data.institute_email,
      personalEmail: data.personal_email,
      signature: data.signature,
      isFirstLogin: data.is_first_login,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      getPublicProfile: function() {
        return {
          id: this.id,
          fullName: this.fullName,
          role: this.role,
          studentNumber: this.studentNumber,
          username: this.username,
          instituteEmail: this.instituteEmail,
          personalEmail: this.personalEmail,
          isFirstLogin: this.isFirstLogin
        };
      }
    };
  }
}

export default User;

