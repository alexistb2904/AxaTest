from rest_framework import serializers
from .models import Proposal, ProposalHistory 

class ProposalSerializer(serializers.ModelSerializer):
    prime_seule_tarif_trc = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    prime_seule_tarif_do = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    prime_seule_tarif_duo = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Proposal
        fields = [
            'id',
            'opportunity_number',
            'client_name',
            'guarantee_type',
            'ouvrage_destination',
            'ouvrage_description',
            'address_chantier',
            'work_type',
            'ouvrage_cost',
            'existing_presence',
            'is_vip_client',
            'rcmo_desired',
            'trc_rate',
            'do_rate',
            'created_at',
            'updated_at',
            'prime_seule_tarif_trc',
            'prime_seule_tarif_do',
            'prime_seule_tarif_duo'
        ]
        read_only_fields = ('created_at', 'updated_at')

    def create(self, validated_data):
        user_ip_from_validated_data = validated_data.pop('user_ip', None)
        
        instance = Proposal(**validated_data)
        
        instance.save(user_ip=user_ip_from_validated_data)
        return instance

    def update(self, instance, validated_data):
        user_ip_from_validated_data = validated_data.pop('user_ip', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save(user_ip=user_ip_from_validated_data)
        return instance

class ProposalHistorySerializer(serializers.ModelSerializer):
    proposal = serializers.StringRelatedField(read_only=True)
    changes = serializers.JSONField(read_only=True)
    timestamp = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)

    class Meta:
        model = ProposalHistory
        fields = [
            'id',
            'proposal',
            'user_ip',
            'timestamp',
            'changes'
        ]
