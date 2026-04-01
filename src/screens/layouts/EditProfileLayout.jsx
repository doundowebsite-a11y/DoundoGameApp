import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Platform, KeyboardAvoidingView, Modal, FlatList } from 'react-native';
import { colors } from '../../theme/colors';
import { IconArrowBack } from '../../assets/icons/icons';
import Button from '../../components/ui/Button';
import { scale, verticalScale, scaleFont } from '../../utils/scale';

const PRESETS = [
  { id: 1, source: require('../../assets/avatars/preset_1.jpg') },
  { id: 2, source: require('../../assets/avatars/preset_2.jpg') },
  { id: 3, source: require('../../assets/avatars/preset_3.jpg') },
  { id: 4, source: require('../../assets/avatars/preset_4.jpg') },
  { id: 5, source: require('../../assets/avatars/avatar_main.jpg') },
];

const EditProfileLayout = (props) => {
  const { navigation, insets, containerW, email, gamerTag, bio, selectedPreset, showAvatarPicker, saving, errorMsg, onGamerTagChange, onBioChange, onSelectPreset, onShowPicker, onHidePicker, onSave, onCancel } = props;
  const currentAvatar = PRESETS.find(p => p.id === selectedPreset)?.source || PRESETS[0].source;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconArrowBack size={scale(24)} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + scale(56)}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarRing} onPress={onShowPicker} activeOpacity={0.8}>
              <Image source={currentAvatar} style={styles.avatarImage} />
              <View style={styles.cameraOverlay}><Text style={{ fontSize: scaleFont(24) }}>📷</Text></View>
            </TouchableOpacity>
            <Text style={styles.tapHint}>Tap to change avatar</Text>
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[styles.inputWrapper, { opacity: 0.6 }]}>
                <Text style={[styles.input, { paddingVertical: verticalScale(14) }]} numberOfLines={1}>{email || '—'}</Text>
              </View>
              <Text style={styles.fieldHint}>Email cannot be changed here.</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Gamer Tag</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={gamerTag} onChangeText={onGamerTagChange} placeholderTextColor={colors.text.placeholder} selectionColor={colors.primary} autoCapitalize="none" maxLength={20} />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput style={styles.textArea} value={bio} onChangeText={onBioChange} multiline numberOfLines={3} textAlignVertical="top" placeholderTextColor={colors.text.placeholder} selectionColor={colors.primary} placeholder="Tell others about yourself..." />
            </View>

            <View style={styles.buttonsGroup}>
              <Button title={saving ? 'Saving...' : 'Save Changes'} onPress={onSave} disabled={saving} />
              <Button title="Cancel" variant="secondary" onPress={onCancel} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showAvatarPicker} transparent animationType="fade" onRequestClose={onHidePicker}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Avatar</Text>
              <TouchableOpacity onPress={onHidePicker} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Text style={{ color: colors.text.muted, fontSize: scaleFont(22) }}>✕</Text></TouchableOpacity>
            </View>
            <FlatList data={PRESETS} keyExtractor={item => String(item.id)} numColumns={3} contentContainerStyle={styles.modalGrid}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.modalCard, selectedPreset === item.id && styles.modalCardSelected]} onPress={() => { onSelectPreset(item.id); onHidePicker(); }} activeOpacity={0.8}>
                  <Image source={item.source} style={styles.modalCardImage} />
                  {selectedPreset === item.id && <View style={styles.modalCardCheck}><Text style={{ color: '#FFF', fontSize: scaleFont(14) }}>✓</Text></View>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const AVATAR_SIZE = scale(110);

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background.dark, alignSelf: 'center', width: '100%' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(16), paddingVertical: verticalScale(14), borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  backButton:      { width: scale(40), height: scale(40), borderRadius: scale(20), alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { color: colors.text.primary, fontSize: scaleFont(17), fontWeight: '700' },
  scrollContent:   { flexGrow: 1, paddingBottom: verticalScale(40) },
  avatarSection:   { alignItems: 'center', paddingVertical: verticalScale(24), gap: scale(8) },
  avatarRing:      { position: 'relative', width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 3, borderColor: colors.primary, overflow: 'hidden' },
  avatarImage:     { width: '100%', height: '100%' },
  cameraOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  tapHint:         { color: colors.text.muted, fontSize: scaleFont(12) },
  errorText:       { color: '#f87171', textAlign: 'center', marginBottom: scale(8), paddingHorizontal: scale(20), fontSize: scaleFont(13) },
  form:            { paddingHorizontal: scale(20), gap: scale(16), width: '100%' },
  fieldGroup:      { gap: scale(6) },
  fieldLabel:      { fontSize: scaleFont(13), fontWeight: '500', color: colors.text.secondary, marginLeft: scale(4) },
  inputWrapper:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30,41,59,0.5)', borderWidth: 1, borderColor: colors.border.subtle, borderRadius: scale(12), overflow: 'hidden', paddingHorizontal: scale(14) },
  input:           { flex: 1, color: colors.text.primary, fontSize: scaleFont(15), paddingVertical: verticalScale(14), fontWeight: '400' },
  textArea:        { backgroundColor: 'rgba(30,41,59,0.5)', borderWidth: 1, borderColor: colors.border.subtle, borderRadius: scale(12), color: colors.text.primary, fontSize: scaleFont(15), padding: scale(14), minHeight: verticalScale(90) },
  fieldHint:       { fontSize: scaleFont(11), color: colors.text.muted, marginLeft: scale(4), marginTop: scale(2) },
  buttonsGroup:    { gap: scale(12), paddingTop: verticalScale(16) },
  modalBackdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet:      { backgroundColor: '#1E293B', borderTopLeftRadius: scale(24), borderTopRightRadius: scale(24), paddingBottom: verticalScale(32), maxHeight: '70%' },
  modalHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: scale(20), borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  modalTitle:      { color: colors.text.primary, fontSize: scaleFont(18), fontWeight: '700' },
  modalGrid:       { padding: scale(16), gap: scale(10) },
  modalCard:       { flex: 1, margin: scale(5), aspectRatio: 1, borderRadius: scale(12), overflow: 'hidden', borderWidth: 1, borderColor: colors.border.subtle, position: 'relative' },
  modalCardSelected: { borderWidth: 3, borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  modalCardImage:  { width: '100%', height: '100%' },
  modalCardCheck:  { position: 'absolute', bottom: scale(4), right: scale(4), backgroundColor: colors.primary, width: scale(22), height: scale(22), borderRadius: scale(11), alignItems: 'center', justifyContent: 'center' },
});

export default EditProfileLayout;