'use client';

import { useState, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase';
import {
  DollarSign,
  Save,
  Upload,
  Plus,
  X,
  Phone,
  MessageSquare,
} from 'lucide-react';

export interface ChaletPlan {
  id: string;
  chalet_model_id: string;
  name: string;
  tag: string;
  area: string;
  description: string;
  features: string[];
  price: number;
  total_units: number;
  image_data: string;
  image_url: string;
  whatsapp_link: string;
  is_active: boolean;
}

export interface LocationDetails {
  id: string;
  phone_number: string;
  whatsapp_number: string;
}

interface SitePlansProps {
  plans: ChaletPlan[];
  setPlans: React.Dispatch<React.SetStateAction<ChaletPlan[]>>;
  locationDetails: LocationDetails | null;
  setLocationDetails: React.Dispatch<React.SetStateAction<LocationDetails | null>>;
  saving: boolean;
  onSave: () => Promise<void>;
  onRefreshPlans: () => Promise<void>;
}

// Função utilitária para aplicar máscara em telefones brasileiros
function formatPhoneNumber(value: string): string {
  if (!value) return '';

  const digitsOnly = value.replace(/\D/g, '');
  const truncated = digitsOnly.slice(0, 11);

  if (truncated.length <= 2) {
    return truncated.length ? `(${truncated}` : '';
  }
  if (truncated.length <= 6) {
    return `(${truncated.slice(0, 2)}) ${truncated.slice(2)}`;
  }
  if (truncated.length <= 10) {
    return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 6)}-${truncated.slice(6)}`;
  }

  return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7, 11)}`;
}

export function SitePlans({
  plans,
  setPlans,
  locationDetails,
  setLocationDetails,
  saving,
  onSave,
  onRefreshPlans,
}: SitePlansProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    tag: 'OPÇÃO',
    area: '40 m²',
    description: '',
    featuresStr: '1 Quarto, Varanda, Banheiro',
    price: 150000,
    total_units: 10,
    whatsapp_link: '',
    image_data: '',
  });

  function handleImageUpload(index: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedPlans = [...plans];
      updatedPlans[index].image_data = reader.result as string;
      setPlans(updatedPlans);
    };
    reader.readAsDataURL(file);
  }

  function handleNewPlanImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPlan((prev) => ({ ...prev, image_data: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleCreateNewPlan() {
    if (!locationDetails?.id) {
      alert('Erro: ID da localização não encontrado.');
      return;
    }

    if (!newPlan.name.trim()) {
      alert('Por favor, informe o nome do plano.');
      return;
    }

    try {
      const featuresArray = newPlan.featuresStr
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      const modelSlug = newPlan.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

      const { data: modelData, error: modelError } = await supabase
        .from('chalet_models')
        .insert({
          slug: `${modelSlug}-${Date.now()}`,
          name: newPlan.name,
          tag: newPlan.tag,
          area: newPlan.area,
          description: newPlan.description,
          features: featuresArray,
          whatsapp_link: newPlan.whatsapp_link || null,
          image_data: newPlan.image_data || null,
        })
        .select()
        .single();

      if (modelError) throw modelError;

      const { error: locChaletError } = await supabase
        .from('location_chalets')
        .insert({
          location_id: locationDetails.id,
          chalet_model_id: modelData.id,
          price: Number(newPlan.price),
          total_units: Number(newPlan.total_units),
          available_units: Number(newPlan.total_units),
          is_active: true,
        });

      if (locChaletError) throw locChaletError;

      alert('Novo plano adicionado com sucesso!');
      setIsModalOpen(false);
      setNewPlan({
        name: '',
        tag: 'OPÇÃO',
        area: '40 m²',
        description: '',
        featuresStr: '1 Quarto, Varanda, Banheiro',
        price: 150000,
        total_units: 10,
        whatsapp_link: '',
        image_data: '',
      });
      await onRefreshPlans();
    } catch (e: any) {
      console.error('Erro ao criar modelo:', e);
      alert('Erro ao criar plano: ' + e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Configuração de Planos e Contato</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Altere os contatos do empreendimento, especificações dos chalés e links diretos para WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-all border border-zinc-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Novo Plano</span>
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {/* SEÇÃO: NÚMEROS DE CONTATO */}
      {locationDetails && (
        <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800/80 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-400" />
            Telefones da Localização
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-semibold text-zinc-500">
                Telefone Principal (Phone Number)
              </label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                maxLength={15}
                value={locationDetails.phone_number}
                onChange={(e) =>
                  setLocationDetails({
                    ...locationDetails,
                    phone_number: formatPhoneNumber(e.target.value),
                  })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-zinc-500">
                WhatsApp Geral (WhatsApp Number)
              </label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                maxLength={15}
                value={locationDetails.whatsapp_number}
                onChange={(e) =>
                  setLocationDetails({
                    ...locationDetails,
                    whatsapp_number: formatPhoneNumber(e.target.value),
                  })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.length === 0 ? (
          <div className="col-span-full p-12 text-center text-zinc-500 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            Nenhum plano cadastrado nesta localização.
          </div>
        ) : (
          plans.map((plan, index) => {
            const currentImg =
              plan.image_data && plan.image_data.trim() !== ''
                ? plan.image_data
                : plan.image_url || `/chales/${plan.name.toLowerCase()}.png`;

            return (
              <div
                key={plan.id}
                className="bg-zinc-900/90 rounded-2xl border border-zinc-800/80 shadow-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full h-44 bg-zinc-950 border-b border-zinc-800/80 group overflow-hidden">
                    <img
                      src={currentImg}
                      alt={plan.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                      {plan.tag || 'DESTAQUE'}
                    </span>

                    <label className="absolute bottom-3 right-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 px-3 py-1.5 rounded-lg text-[11px] text-white flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-md transition-all">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Alterar Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(index, e)}
                      />
                    </label>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-semibold text-zinc-500">Nome do Plano</label>
                        <input
                          type="text"
                          value={plan.name}
                          onChange={(e) => {
                            const newPlans = [...plans];
                            newPlans[index].name = e.target.value;
                            setPlans(newPlans);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white font-semibold mt-1 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-semibold text-zinc-500">Tag / Badge</label>
                        <input
                          type="text"
                          value={plan.tag}
                          onChange={(e) => {
                            const newPlans = [...plans];
                            newPlans[index].tag = e.target.value;
                            setPlans(newPlans);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white mt-1 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-semibold text-zinc-500">Área</label>
                        <input
                          type="text"
                          value={plan.area}
                          onChange={(e) => {
                            const newPlans = [...plans];
                            newPlans[index].area = e.target.value;
                            setPlans(newPlans);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white mt-1 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-semibold text-zinc-500">Total Unidades</label>
                        <input
                          type="number"
                          value={plan.total_units}
                          onChange={(e) => {
                            const newPlans = [...plans];
                            newPlans[index].total_units = Number(e.target.value);
                            setPlans(newPlans);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white mt-1 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-semibold text-zinc-500">Link de WhatsApp do Chalé</label>
                      <div className="relative mt-1">
                        <MessageSquare className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                        <input
                          type="text"
                          placeholder="https://wa.me/..."
                          value={plan.whatsapp_link}
                          onChange={(e) => {
                            const newPlans = [...plans];
                            newPlans[index].whatsapp_link = e.target.value;
                            setPlans(newPlans);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 pl-8 pr-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-semibold text-zinc-500">Descrição Breve</label>
                      <textarea
                        rows={2}
                        value={plan.description}
                        onChange={(e) => {
                          const newPlans = [...plans];
                          newPlans[index].description = e.target.value;
                          setPlans(newPlans);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white mt-1 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-semibold text-zinc-500">Características (Vírgula)</label>
                      <input
                        type="text"
                        value={plan.features ? plan.features.join(', ') : ''}
                        onChange={(e) => {
                          const newPlans = [...plans];
                          newPlans[index].features = e.target.value
                            .split(',')
                            .map((f) => f.trim())
                            .filter(Boolean);
                          setPlans(newPlans);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white mt-1 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60">
                      <div>
                        <label className="text-[10px] uppercase font-semibold text-zinc-500">Preço (R$)</label>
                        <div className="relative mt-1">
                          <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="number"
                            value={plan.price}
                            onChange={(e) => {
                              const newPlans = [...plans];
                              newPlans[index].price = Number(e.target.value);
                              setPlans(newPlans);
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 pl-7 pr-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-semibold text-zinc-500">Status</label>
                        <select
                          value={plan.is_active ? 'true' : 'false'}
                          onChange={(e) => {
                            const newPlans = [...plans];
                            newPlans[index].is_active = e.target.value === 'true';
                            setPlans(newPlans);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white mt-1 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="true">Ativo</option>
                          <option value="false">Oculto</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: NOVO PLANO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Criar Novo Plano / Chalé
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400">Nome do Modelo</label>
                  <input
                    type="text"
                    placeholder="Ex: Master Luxe"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Tag / Destaque</label>
                  <input
                    type="text"
                    placeholder="Ex: POPULAR, ESSENCIAL"
                    value={newPlan.tag}
                    onChange={(e) => setNewPlan({ ...newPlan, tag: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-zinc-400">Área (m²)</label>
                  <input
                    type="text"
                    placeholder="Ex: 50 m²"
                    value={newPlan.area}
                    onChange={(e) => setNewPlan({ ...newPlan, area: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400">Preço (R$)</label>
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400">Unidades</label>
                  <input
                    type="number"
                    value={newPlan.total_units}
                    onChange={(e) => setNewPlan({ ...newPlan, total_units: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400">Link de WhatsApp do Chalé</label>
                <input
                  type="text"
                  placeholder="https://wa.me/55..."
                  value={newPlan.whatsapp_link}
                  onChange={(e) => setNewPlan({ ...newPlan, whatsapp_link: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400">Descrição Breve</label>
                <textarea
                  rows={2}
                  placeholder="Descrição sobre o chalé..."
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400">Características (Separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="Ex: 2 quartos, Varanda Gourmet, Deck"
                  value={newPlan.featuresStr}
                  onChange={(e) => setNewPlan({ ...newPlan, featuresStr: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mt-1 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400">Foto do Chalé</label>
                <div className="flex items-center gap-3 mt-1">
                  {newPlan.image_data && (
                    <img
                      src={newPlan.image_data}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-zinc-700"
                    />
                  )}
                  <label className="cursor-pointer bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Carregar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleNewPlanImageUpload}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewPlan}
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20"
              >
                {saving ? 'Criando...' : 'Salvar e Criar Plano'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}